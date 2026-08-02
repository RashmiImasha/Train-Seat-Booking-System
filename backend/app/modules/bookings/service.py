import uuid
 
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.segments import leg_mask
from app.db.models import Booking, BookingStatus, Coach, CoachType, Seat, SeatAvailability, Station, User, UserRole, Route, TrainSchedule
from app.modules.fares.service import calculate_fare
from app.modules.schedules.service import get_schedule_or_404
from app.schemas.booking import BookingCreate

 
async def _get_reserved_seat_or_404(db: AsyncSession, seat_id: uuid.UUID) -> Seat:
    result = await db.execute(
        select(Seat).join(Coach).where(Seat.id == seat_id, Coach.coach_type == CoachType.RESERVED)
    )
    seat = result.scalar_one_or_none()
    if seat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserved seat not found")
    return seat
 
 
async def create_booking(
    db: AsyncSession, schedule_id: uuid.UUID, seat_id: uuid.UUID, payload: BookingCreate, current_user: User
) -> Booking:
    schedule = await get_schedule_or_404(db, schedule_id)
    seat = await _get_reserved_seat_or_404(db, seat_id)
 
    origin = await db.get(Station, payload.origin_station_id)
    destination = await db.get(Station, payload.destination_station_id)
    if origin is None or origin.route_id != schedule.route_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="origin station is not on this schedule's route")
    if destination is None or destination.route_id != schedule.route_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="destination station is not on this schedule's route"
        )
    if origin.sequence_order >= destination.sequence_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="origin must come before destination on the route"
        )
 
    new_mask = leg_mask(origin.sequence_order, destination.sequence_order)
 
    # THE CRITICAL OPERATION: an atomic check-and-set in a single statement.
    # The WHERE clause's overlap check (occupied_mask & new_mask = 0) and the
    # write (occupied_mask | new_mask) happen as one indivisible unit at the
    # database level -- two concurrent requests for overlapping legs on the
    # same seat cannot both pass this WHERE clause and both update the row.
    # Whichever transaction's UPDATE commits first "wins"; the loser's
    # UPDATE affects zero rows (rowcount == 0), which we treat as a conflict.
    result = await db.execute(
        update(SeatAvailability)
        .where(
            SeatAvailability.seat_id == seat_id,
            SeatAvailability.train_schedule_id == schedule_id,
            SeatAvailability.occupied_mask.op("&")(new_mask) == 0,
        )
        .values(occupied_mask=SeatAvailability.occupied_mask.op("|")(new_mask))
    )
 
    if result.rowcount == 0:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This seat is no longer available for the requested leg -- please choose another seat or leg",
        )
 
    fare = await calculate_fare(db, schedule.route_id, origin.sequence_order, destination.sequence_order)
 
    booking = Booking(
        seat_id=seat_id,
        train_schedule_id=schedule_id,
        origin_station_id=origin.id,
        destination_station_id=destination.id,
        user_id=current_user.id,
        fare=fare,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking

async def get_all_bookings(db: AsyncSession) -> list[Booking]:
    result = await db.execute(select(Booking))
    return list(result.scalars().all())


async def list_my_bookings(db: AsyncSession, user: User) -> list[dict]:
    result = await db.execute(
        select(
            Booking,
            Route.name.label("route_name"),
            Seat.seat_number,
            Coach.coach_number,
            TrainSchedule.travel_date,
        )
        .join(Seat, Booking.seat_id == Seat.id)
        .join(Coach, Seat.coach_id == Coach.id)
        .join(TrainSchedule, Booking.train_schedule_id == TrainSchedule.id)
        .join(Route, TrainSchedule.route_id == Route.id)
        .where(Booking.user_id == user.id)
        .order_by(Booking.booked_at.desc())
    )
    rows = result.all()

    station_ids = {row.Booking.origin_station_id for row in rows} | {
        row.Booking.destination_station_id for row in rows
    }
    stations_result = await db.execute(select(Station).where(Station.id.in_(station_ids)))
    station_names = {s.id: s.name for s in stations_result.scalars().all()}

    return [
        {
            **{c: getattr(row.Booking, c) for c in Booking.__table__.columns.keys()},
            "route_name": row.route_name,
            "seat_number": row.seat_number,
            "coach_number": row.coach_number,
            "travel_date": row.travel_date,
            "origin_station_name": station_names.get(row.Booking.origin_station_id, "Unknown"),
            "destination_station_name": station_names.get(row.Booking.destination_station_id, "Unknown"),
        }
        for row in rows
    ]


async def get_booking_or_404(db: AsyncSession, booking_id: uuid.UUID) -> Booking:
    booking = await db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking
 
 
async def cancel_booking(db: AsyncSession, booking_id: uuid.UUID, current_user: User) -> Booking:
    booking = await get_booking_or_404(db, booking_id)
 
    # Only the booking's owner or an admin can cancel it -- otherwise any
    # logged-in passenger could cancel anyone else's ticket by guessing IDs.
    if booking.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own bookings")
 
    # Atomically flip the booking to cancelled ONLY if it's still confirmed --
    # guards against two concurrent cancel requests both clearing the mask's
    # bits (clearing is idempotent so it's not unsafe, but this keeps the
    # booking's own status transition itself race-free and gives a clean
    # error on a double-cancel attempt instead of silently succeeding twice).
    result = await db.execute(
        update(Booking)
        .where(Booking.id == booking_id, Booking.status == BookingStatus.CONFIRMED)
        .values(status=BookingStatus.CANCELLED)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already cancelled")
 
    origin = await db.get(Station, booking.origin_station_id)
    destination = await db.get(Station, booking.destination_station_id)
    freed_mask = leg_mask(origin.sequence_order, destination.sequence_order)
 
    await db.execute(
        update(SeatAvailability)
        .where(
            SeatAvailability.seat_id == booking.seat_id,
            SeatAvailability.train_schedule_id == booking.train_schedule_id,
        )
        .values(occupied_mask=SeatAvailability.occupied_mask.op("&")(~freed_mask))
    )
 
    await db.commit()
    await db.refresh(booking)
    return booking
import datetime, enum, uuid
 
from sqlalchemy import BigInteger, Date, Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
 
 
class Base(DeclarativeBase):
    pass
 
 
class CoachType(str, enum.Enum):
    RESERVED = "reserved"
    UNRESERVED = "unreserved"
 
 
class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PASSENGER = "passenger"

class User(Base):
    """
    An account with a role. Only two roles exist: a single hardcoded admin
    (seeded at startup -- see main.py) and self-registered passengers.
    Bookings reference user_id (not a free-text passenger name), so a
    booking is always tied to a real authenticated account.
    """
 
    __tablename__ = "users"
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
 
 
class Route(Base):
    """
    A named line, e.g. 'Colombo Fort-Badulla'. Everything else (stations,
    coach templates) hangs off a route, which is what makes the number of
    stations/coaches configurable rather than hardcoded.
    """
 
    __tablename__ = "routes"
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
 
    stations: Mapped[list["Station"]] = relationship(
        back_populates="route", cascade="all, delete-orphan", order_by="Station.sequence_order"
    )
    coaches: Mapped[list["Coach"]] = relationship(back_populates="route", cascade="all, delete-orphan")
 
 
class Station(Base):
    """
    A stop on a route. sequence_order defines the station's position along
    the line (0-indexed) -- this ordering is what segment indices are
    derived from later (segment i = gap between sequence_order i and i+1).
    """
 
    __tablename__ = "stations"
    __table_args__ = (
        UniqueConstraint("route_id", "sequence_order", name="uq_station_route_sequence"),
    )
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
 
    # Distance in km from the *previous* station (0 for the first station on
    # the route). Feeds the fare calculation module later -- kept here since
    # it's a property of the station's position on the route, not a booking.
    distance_from_previous_km: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
 
    route: Mapped["Route"] = relationship(back_populates="stations")
 
 
class Coach(Base):
    """
    A coach template for a route -- e.g. 'Coach 1, reserved, 40 seats'.
    Seats for an actual train_schedule are provisioned from these templates
    (built in a later step), which is what keeps coach count/seat count
    configurable per route instead of hardcoded.
    """
 
    __tablename__ = "coaches"
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    coach_number: Mapped[int] = mapped_column(Integer, nullable=False)
    coach_type: Mapped[CoachType] = mapped_column(Enum(CoachType, name="coach_type"), nullable=False)
    seat_count: Mapped[int] = mapped_column(Integer, nullable=False)
 
    route: Mapped["Route"] = relationship(back_populates="coaches")
    seats: Mapped[list["Seat"]] = relationship(back_populates="coach", cascade="all, delete-orphan")
 
 
class Seat(Base):
    """
    A physical seat within a coach -- e.g. seat 14 in Coach 1. Seats are a
    property of the coach template itself (not per travel date), since the
    physical seat layout doesn't change day to day. Only reserved coaches
    get individual seat rows; unreserved coaches are first-come-first-served
    and are handled separately (no segment booking applies to them).
    """
 
    __tablename__ = "seats"
    __table_args__ = (
        UniqueConstraint("coach_id", "seat_number", name="uq_seat_coach_number"),
    )
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coach_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("coaches.id", ondelete="CASCADE"), nullable=False)
    seat_number: Mapped[int] = mapped_column(Integer, nullable=False)
 
    coach: Mapped["Coach"] = relationship(back_populates="seats")
 
 
class TrainSchedule(Base):
    """
    A specific run of a route on a specific date -- this is what scopes
    seat occupancy. Seat 14's booking on Aug 5 has nothing to do with its
    booking on Aug 6, so every seat_availability row is keyed off a
    train_schedule, not just a seat.
    """
 
    __tablename__ = "train_schedules"
    __table_args__ = (
        UniqueConstraint("route_id", "travel_date", name="uq_schedule_route_date"),
    )
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    travel_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
 
    route: Mapped["Route"] = relationship()
 
 
class SeatAvailability(Base):
    """
    The bitmask row: one per (seat, train_schedule). occupied_mask has one
    bit per route segment -- bit i set means segment i (the gap between
    station sequence_order i and i+1) is currently booked on this seat, for
    this specific schedule/date. BigInteger comfortably covers routes with
    up to 63 segments (64 stations), which is far beyond any realistic
    train line -- see the segment-count derivation in core/segments.py.
    """
 
    __tablename__ = "seat_availability"
    __table_args__ = (
        UniqueConstraint("seat_id", "train_schedule_id", name="uq_seat_availability_seat_schedule"),
    )
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("seats.id", ondelete="CASCADE"), nullable=False)
    train_schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("train_schedules.id", ondelete="CASCADE"), nullable=False
    )
    occupied_mask: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
 
    seat: Mapped["Seat"] = relationship()
    train_schedule: Mapped["TrainSchedule"] = relationship()
 
 
class Booking(Base):
    """
    The audit/history record for a confirmed (or later cancelled) segment
    booking. Deliberately separate from seat_availability.occupied_mask:
    the mask is the fast, atomic source of truth for concurrency control,
    while this table is the normalized, human-readable record used for
    receipts, cancellations, and reporting. If the mask and this table ever
    drift, the mask can be rebuilt from the confirmed bookings here.
    """
 
    __tablename__ = "bookings"
 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("seats.id", ondelete="RESTRICT"), nullable=False)
    train_schedule_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("train_schedules.id", ondelete="RESTRICT"), nullable=False
    )
    origin_station_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False)
    destination_station_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)


    fare: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status"), nullable=False, default=BookingStatus.CONFIRMED
    )
    booked_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
 
    seat: Mapped["Seat"] = relationship()
    train_schedule: Mapped["TrainSchedule"] = relationship()
    user: Mapped["User"] = relationship()
"""
Fixtures for LIVE concurrency tests -- these hit an already-running backend
over real HTTP, against a real Postgres database. They are deliberately
separate from the main tests/ suite (which uses in-memory SQLite and needs
no running server) because true concurrency guarantees can only be proven
against Postgres: SQLite serializes writes internally regardless of what
the application code does, so it can't actually exercise a race condition.

Prerequisite: the backend must already be running and reachable at
BASE_URL (e.g. via `docker compose up`), with the hardcoded admin account
seeded (true on any normal startup).
"""
import httpx
import pytest_asyncio

BASE_URL = "http://localhost:8000"


async def _register_and_login(client: httpx.AsyncClient, username: str, password: str = "password123") -> str:
    await client.post(f"{BASE_URL}/user/register", json={"username": username, "password": password})
    r = await client.post(f"{BASE_URL}/user/login", json={"username": username, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


@pytest_asyncio.fixture
async def register_and_login():
    """Exposes the helper as a fixture so test files don't need relative imports."""
    return _register_and_login


@pytest_asyncio.fixture
async def admin_headers():
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{BASE_URL}/user/login", json={"username": "admin", "password": "admin123"})
        r.raise_for_status()
        return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest_asyncio.fixture
async def route_with_two_coaches(admin_headers):
    """
    Builds a fresh route (4 stations, 2 reserved coaches: 2 seats + 1 seat)
    and a schedule, entirely via the real API -- every test gets its own
    isolated route/schedule, so tests never interfere with each other even
    though they share one real database.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{BASE_URL}/routes",
            json={"name": "Concurrency Test Route", "train_name": "Podi Menike"},
            headers=admin_headers,
        )
        route_id = r.json()["id"]

        station_ids = {}
        for name, seq, dist in [
            ("Colombo Fort", 0, 0), ("Kandy", 1, 115), ("Nanuoya", 2, 80), ("Badulla", 3, 60),
        ]:
            r = await client.post(
                f"{BASE_URL}/routes/{route_id}/stations",
                json={"name": name, "sequence_order": seq, "distance_from_previous_km": dist},
                headers=admin_headers,
            )
            station_ids[name] = r.json()["id"]

        # Both coaches must exist BEFORE the schedule is created -- schedule
        # creation is what provisions seat_availability rows per seat.
        await client.post(
            f"{BASE_URL}/routes/{route_id}/coaches",
            json={
                "coach_number": 1,
                "coach_name": "1st_class",
                "coach_type": "reserved",
                "seat_count": 2,
            },
            headers=admin_headers,
        )
        await client.post(
            f"{BASE_URL}/routes/{route_id}/coaches",
            json={
                "coach_number": 2,
                "coach_name": "2nd_class",
                "coach_type": "reserved",
                "seat_count": 1,
            },
            headers=admin_headers,
        )

        r = await client.post(
            f"{BASE_URL}/schedules",
            json={"route_id": route_id, "travel_date": "2027-03-01"},
            headers=admin_headers,
        )
        schedule_id = r.json()["id"]

        r = await client.get(f"{BASE_URL}/schedules/{schedule_id}/coaches", headers=admin_headers)
        coaches = r.json()
        coach1_seats = next(c for c in coaches if c["coach_number"] == 1)["seats"]
        coach2_seat = next(c for c in coaches if c["coach_number"] == 2)["seats"][0]

    return {
        "schedule_id": schedule_id,
        "station_ids": station_ids,
        "seat_adjacent": coach1_seats[0]["id"],
        "seat_overlap": coach1_seats[1]["id"],
        "seat_race": coach2_seat["id"],
    }
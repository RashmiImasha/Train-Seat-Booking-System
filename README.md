# Segment-Based Train Seat Booking System

A booking system for Sri Lanka's Colombo Fort–Badulla line that lets a single reserved seat be booked independently for multiple, non-overlapping legs of the same journey — so a seat vacated partway through the trip becomes available again for someone else, and each passenger is charged only for the distance they actually travel.

Built for the Lanka Software Foundation (LSF) Software Engineer interview take-home assignment.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Running the Project](#running-the-project)
- [Core Design Decisions](#core-design-decisions)
- [Concurrency Correctness — Proof, Not Just Design](#concurrency-correctness--proof-not-just-design)
- [Alternatives Considered](#alternatives-considered)
- [Challenges Faced](#challenges-faced)
- [Extra Credit](#extra-credit)
- [Known Limitations / Future Work](#known-limitations--future-work)
- [Project Structure](#project-structure)

## Overview

The reserved coaches on this line are currently booked as if reserved for the entire journey, even when a passenger only travels part of it — meaning a seat sits empty (and unsellable) once its original passenger disembarks, and partial-journey passengers are overcharged to compensate. This system fixes that by modeling seat occupancy at the **segment** level (the gap between two consecutive stations) rather than as a single whole-journey reservation, letting the same physical seat be resold for different legs and billed only for the distance travelled.

**Roles:**
- **Admin** (single hardcoded account) — configures routes, stations, coaches, and schedules; views all bookings and system-wide seat maps
- **Passenger** (self-registers) — searches for a train, views seat availability for a specific leg, books a seat, views/cancels their own bookings

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI (Python, async) |
| Database | PostgreSQL |
| Frontend | React + Vite + TypeScript, Tailwind CSS |
| Auth | JWT (PyJWT), bcrypt password hashing |
| Containerization | Docker Compose (Postgres + backend + frontend, one command) |

## Running the Project

```bash
git clone <this-repo-url>
cd Train-Seat-Booking-System
cp .env.example .env
docker compose up -d --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Adminer (DB inspection): [http://localhost:8080](http://localhost:8080)

The hardcoded admin account (see [Core Design Decisions](#authentication--rbac)) is seeded automatically on first backend startup — no manual setup step is needed to log in as admin.

**Manual step that can't be automated away:** copying `.env.example` to `.env` — this keeps real configuration values out of version control while documenting exactly which variables the system needs.

## Core Design Decisions

### Segment occupancy: a bitmask, not a booking-interval list

Each seat's occupancy for a given scheduled train is stored as a single integer — `occupied_mask` — where bit *i* represents whether segment *i* (the gap between the *i*-th and *(i+1)*-th station on the route) is currently booked. A journey from station *a* to station *b* sets bits *a* through *b−1*.

This makes the core operation of the whole system — "does this leg overlap any existing booking on this seat?" — a single bitwise AND: `occupied_mask & requested_mask == 0` means free. Booking is `occupied_mask |= requested_mask`; cancelling is `occupied_mask &= ~requested_mask`. All O(1).

The bitmask's width is derived at runtime from the number of stations on the route (`segment_count = station_count - 1`), not hardcoded — so adding stations to a route, or supporting a completely different route with a different station count, requires no code change.

### Fare calculation

Fare = the sum of each booked segment's real distance (`distance_from_previous_km`, configured per station) × a flat rate per km. This directly fixes the problem described in the brief: a partial-journey passenger is charged for their actual distance, not a fraction of a fixed whole-route fare. A `/schedules/{id}/fare` preview endpoint lets the frontend show the exact price *before* the passenger commits — using the identical calculation used at booking time, so there's no risk of the preview and the actual charge drifting apart.

### Concurrency: atomic conditional UPDATE

The write that actually books a seat is a single SQL statement:

```sql
UPDATE seat_availability
SET occupied_mask = occupied_mask | :new_mask
WHERE seat_id = :seat_id AND train_schedule_id = :schedule_id
  AND (occupied_mask & :new_mask) = 0
RETURNING occupied_mask;
```

The overlap check and the write happen as one indivisible database operation. Two concurrent requests for overlapping legs on the same seat cannot both pass this `WHERE` clause and both succeed — whichever transaction commits first "wins"; the other affects zero rows, which the API surfaces as `409 Conflict`. This is conceptually a compare-and-swap: rather than locking the row up front (pessimistic locking) or catching a database-level constraint violation, the correctness guarantee comes directly from Postgres's row-level MVCC semantics acting on the `WHERE` clause.

### Authentication & RBAC

Two roles: `admin` and `passenger`. There is exactly one admin account, its credentials hardcoded in `app/config.py` and seeded into the database automatically (idempotently) on every backend startup — deliberate, since this system only ever needs one back-office operator, not a self-service admin-management flow. Passengers self-register through `/auth/register`, which can only ever create a `passenger`-role account; there is no code path, public or otherwise, that lets a client request the `admin` role.

Bookings are tied to `user_id` (from the authenticated JWT), not a free-text passenger name — this prevents one passenger's request from being attributed to someone else, and lets passengers list and cancel only their own bookings (enforced server-side, not just hidden in the UI).

### Configurability

Number of coaches, seats per coach, and stations per route are all admin-configurable through the API/UI, not hardcoded — verified by testing with routes of different station counts and coaches of different types/seat counts.

## Concurrency Correctness — Proof, Not Just Design

Given this is the crux of the assignment, it's backed by live tests against real Postgres (not SQLite — SQLite serializes all writes internally regardless of application logic, so it cannot actually exercise a race condition; see `tests/live/`). Three scenarios, each fired as genuinely simultaneous requests (separate connections, separate users, `asyncio.gather`) rather than sequential calls:

| Scenario | Result |
|---|---|
| Two adjacent (non-overlapping) legs on the same seat, booked concurrently | Both succeed |
| Two partially-overlapping (not identical) legs on the same seat, booked concurrently | Exactly one succeeds, one gets `409` |
| 25 identical concurrent booking attempts on the same seat/leg | Exactly one succeeds, 24 get `409` |

Run these yourself:
```bash
cd backend
python -m pytest tests/live/ -v
```
(requires the backend already running against Postgres — see [Running the Project](#running-the-project))

## Alternatives Considered

**Row-level locking (`SELECT ... FOR UPDATE`)** instead of the atomic conditional UPDATE — rejected in favor of the conditional UPDATE because it avoids an explicit lock-then-check-then-write sequence (fewer round trips, less code), while providing the same correctness guarantee. Locking becomes more attractive under very high contention on a single hot row, which isn't the expected access pattern here (many distinct seats, not thousands of requests hammering one seat).

**Database range types + exclusion constraints** (Postgres `int4range` + `EXCLUDE USING gist`) — a strong alternative that lets the database itself refuse overlapping ranges as a data-integrity rule. Not used here because the discrete, station-aligned nature of this problem (legs are always station-to-station, never arbitrary continuous ranges) makes a bitmask simpler and faster (O(1) bitwise AND vs. an O(log n) GiST index lookup) without losing any correctness.

**Serializable transaction isolation** — would also work, but requires explicit retry-on-conflict handling in application code for a guarantee the conditional UPDATE already provides with less complexity.

**Auto-assigned seats vs. passenger-chosen seats** — passengers explicitly choose their seat from the seat map (like most real booking systems), rather than the system auto-assigning one; this was a deliberate product decision, not a technical constraint.

## Challenges Faced

- **CORS during frontend/backend integration**: writes from the browser initially failed at the preflight `OPTIONS` step (405) before reaching any route handler, since no CORS middleware was configured — resolved by adding `CORSMiddleware` with an explicit allowed-origins list.
- **Provisioning order dependency**: `seat_availability` rows are only created for seats that exist on a route's reserved coaches *at the time a schedule is created* — a coach added after schedule creation has no seats available for that schedule. This is a known ordering constraint (documented in code comments) rather than a bug: coach/route configuration should be finalized before scheduling a specific date.
- **Distinguishing true concurrency from serialized concurrency**: an early version of this system's concurrency test ran against SQLite and technically "passed," but for the wrong reason — SQLite's single-writer lock serializes all writes regardless of application logic, so the test proved nothing about the actual database-level guarantee. Switching the concurrency proof to run against real Postgres was necessary to make the test meaningful.

## Extra Credit

**Seat map visualization** — implemented for both admin and passenger views. Seats are color-coded (free / partially booked / fully booked for the full route) and clicking a seat shows its exact booked segment ranges (e.g., "Colombo Fort → Kandy") as a plain list, not a selection control, since the information is purely informational rather than something to be picked.

**Admin booking view** — a filterable (by status, by date) table of all bookings system-wide, with a running total of confirmed-booking count and income (or cancelled-booking count and lost revenue, depending on the active filter), computed live from whatever's currently loaded rather than tracked separately — so it can never drift out of sync with the actual filtered data.

*(Waitlisting and fare logic beyond flat per-km pricing were considered and designed conceptually but not implemented, given time constraints and the assignment's explicit guidance to prioritize a solid core over a longer extra-credit list.)*

## Known Limitations / Future Work

- No waitlisting for fully-booked segments.
- Fare logic is flat-rate-per-km only; no peak pricing, demand-based pricing, or coach-type multipliers.
- No real-time (push/poll) refresh of seat availability in the UI — a `409 Conflict` on booking is the mechanism for catching a seat taken moments earlier, rather than proactive live updates.
- Schema migrations are currently handled via `create_all` at startup rather than Alembic migrations (Alembic is included in dependencies but not yet wired up) — fine for the current stage of development, but would need proper migrations before further schema evolution against a database with real data.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # app entrypoint, CORS, admin seeding
│   │   ├── config.py             # settings, hardcoded admin credentials
│   │   ├── core/                  # segment math, JWT/password helpers, shared validation
│   │   ├── db/                     # SQLAlchemy models, session
│   │   ├── schemas/                 # Pydantic request/response models
│   │   └── modules/                  # one folder per domain: routes, coaches,
│   │                                    schedules, availability, bookings, fares, auth
│   ├── tests/
│   │   ├── conftest.py             # SQLite fixtures for fast unit/integration tests
│   │   └── live/                    # Postgres-backed concurrency proof tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                    # one module per backend domain
│   │   ├── auth/                    # JWT context, route guards
│   │   ├── components/               # SeatMap, layout shells, shared UI
│   │   └── pages/
│   │       ├── admin/                 # routes, schedules, seat map, bookings
│   │       └── passenger/              # search, seat map, confirm, my bookings
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

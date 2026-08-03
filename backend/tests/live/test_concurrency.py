# """
# Proves the three concurrency guarantees the assignment names explicitly:
# - adjacent legs on the same seat, booked simultaneously, both succeed
# - overlapping (but not identical) legs, booked simultaneously, only one succeeds
# - many identical concurrent attempts on one seat, exactly one succeeds

# Run with the backend already up and pointed at Postgres:
#     python3 -m pytest tests/live/ -v
# """
# import asyncio

# import httpx

# BASE_URL = "http://localhost:8000"


# async def _attempt_booking(token: str, schedule_id: str, seat_id: str, origin_id: str, destination_id: str):
#     async with httpx.AsyncClient(timeout=30.0) as client:
#         return await client.post(
#             f"{BASE_URL}/schedules/{schedule_id}/seats/{seat_id}/bookings",
#             json={"origin_station_id": origin_id, "destination_station_id": destination_id},
#             headers={"Authorization": f"Bearer {token}"},
#         )


# async def test_adjacent_legs_both_succeed_concurrently(route_with_two_coaches, register_and_login):
#     ctx = route_with_two_coaches
#     async with httpx.AsyncClient(timeout=30.0) as client:
#         token_a = await register_and_login(client, "pytest_adjacent_a")
#         token_b = await register_and_login(client, "pytest_adjacent_b")

#     # Colombo Fort->Kandy and Kandy->Badulla on the SAME seat, fired at the
#     # same instant -- these don't overlap, so both must succeed.
#     results = await asyncio.gather(
#         _attempt_booking(
#             token_a, ctx["schedule_id"], ctx["seat_adjacent"],
#             ctx["station_ids"]["Colombo Fort"], ctx["station_ids"]["Kandy"],
#         ),
#         _attempt_booking(
#             token_b, ctx["schedule_id"], ctx["seat_adjacent"],
#             ctx["station_ids"]["Kandy"], ctx["station_ids"]["Badulla"],
#         ),
#     )
#     assert [r.status_code for r in results] == [201, 201], \
#         f"Expected both adjacent bookings to succeed, got {[r.status_code for r in results]}"


# async def test_partial_overlap_only_one_succeeds(route_with_two_coaches, register_and_login):
#     ctx = route_with_two_coaches
#     async with httpx.AsyncClient(timeout=30.0) as client:
#         token_c = await register_and_login(client, "pytest_overlap_c")
#         token_d = await register_and_login(client, "pytest_overlap_d")

#     # Colombo Fort->Nanuoya and Kandy->Badulla share the Kandy->Nanuoya
#     # segment -- fired concurrently, only ONE may succeed.
#     results = await asyncio.gather(
#         _attempt_booking(
#             token_c, ctx["schedule_id"], ctx["seat_overlap"],
#             ctx["station_ids"]["Colombo Fort"], ctx["station_ids"]["Nanuoya"],
#         ),
#         _attempt_booking(
#             token_d, ctx["schedule_id"], ctx["seat_overlap"],
#             ctx["station_ids"]["Kandy"], ctx["station_ids"]["Badulla"],
#         ),
#     )
#     statuses = sorted(r.status_code for r in results)
#     assert statuses == [201, 409], f"Expected exactly one success + one conflict, got {statuses}"


# async def test_25_identical_concurrent_requests_exactly_one_winner(route_with_two_coaches, register_and_login):
#     ctx = route_with_two_coaches
#     async with httpx.AsyncClient(timeout=30.0) as client:
#         tokens = await asyncio.gather(*[register_and_login(client, f"pytest_racer_{i}") for i in range(25)])

#     results = await asyncio.gather(*[
#         _attempt_booking(
#             t, ctx["schedule_id"], ctx["seat_race"],
#             ctx["station_ids"]["Colombo Fort"], ctx["station_ids"]["Badulla"],
#         )
#         for t in tokens
#     ])
#     statuses = [r.status_code for r in results]
#     assert statuses.count(201) == 1, f"Expected exactly 1 success, got {statuses.count(201)}. Statuses: {statuses}"
#     assert statuses.count(409) == 24, f"Expected exactly 24 conflicts, got {statuses.count(409)}"
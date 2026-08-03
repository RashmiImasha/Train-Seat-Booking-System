"""
Segment-index math. A route with N stations (sequence_order 0..N-1) has
N-1 segments; segment i is the gap between the station at sequence_order i
and the station at sequence_order i+1.
 
A journey leg from origin (sequence_order a) to destination (sequence_order
b), with a < b, occupies segments a, a+1, ..., b-1.
 
Kept as pure functions with no DB/framework dependency so they're trivially
unit-testable and reusable by schedules, availability, and bookings.
"""
 
MAX_SUPPORTED_SEGMENTS = 63  # fits in a single BigInteger (signed 64-bit) column
 
 
def segment_count(station_count: int) -> int:
    if station_count < 2:
        raise ValueError("A route needs at least 2 stations to have any segments")
    count = station_count - 1
    if count > MAX_SUPPORTED_SEGMENTS:
        raise ValueError(
            f"Route has {count} segments, exceeding the {MAX_SUPPORTED_SEGMENTS} "
            "this bitmask column supports -- switch to a bit-array column for routes this large."
        )
    return count
 
 
def leg_mask(origin_sequence: int, destination_sequence: int) -> int:
    """
    Build the bitmask for a leg spanning segments [origin_sequence, destination_sequence).
    Raises ValueError if origin >= destination (not a valid forward leg).
    """
    if origin_sequence >= destination_sequence:
        raise ValueError("origin_sequence must be less than destination_sequence")
    width = destination_sequence - origin_sequence
    return ((1 << width) - 1) << origin_sequence


def full_mask(segment_count: int) -> int:
    """The mask representing every segment booked -- i.e. the entire route."""
    return (1 << segment_count) - 1


def decode_ranges(mask: int, segment_count: int) -> list[tuple[int, int]]:
    """
    Decomposes an occupied_mask back into contiguous booked (start, end)
    segment ranges, inverse of leg_mask. E.g. mask with segments 0 and 2
    set (non-adjacent) returns [(0,1), (2,3)] -- two separate bookings on
    the same seat, not one. Used to render "Colombo-Gampaha, Kandy-Nanuoya"
    style breakdowns for the seat map.
    """
    ranges = []
    i = 0
    while i < segment_count:
        if mask & (1 << i):
            start = i
            while i < segment_count and mask & (1 << i):
                i += 1
            ranges.append((start, i))
        else:
            i += 1
    return ranges
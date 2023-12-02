from typing import List 
def get_id_ranges(min_id: int, max_id: int, id_stride: int) -> List[tuple]:
  partial_id_ranges = [
      (i, i + id_stride - 1) for i in range(min_id, max_id, id_stride)
  ]
  partial_id_ranges_trimmed = [
      (max(start_id, min_id), min(end_id, max_id)) for start_id, end_id in partial_id_ranges
  ]
  return partial_id_ranges_trimmed
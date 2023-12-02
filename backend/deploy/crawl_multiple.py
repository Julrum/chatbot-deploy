import pandas as pd
import asyncio
import aiohttp
from typing import List 

base_url = "https://crawler-z5eqvjec2q-uc.a.run.app/crawl"
request_body_base = {
    "host": "http://10.128.0.4",
    "port": 8000,
    "collectionName": "hyu-startup-notice",
    "maxRetry": 3,
    "maxContentLength": 400,
    "maxRecursionDepth": 3
}

max_id = 3108
min_id = 2900
id_stride = 20
def get_id_ranges(min_id: int, max_id: int, id_stride: int) -> List[tuple]:
  partial_id_ranges = [
      (i, i + id_stride - 1) for i in range(min_id, max_id, id_stride)
  ]
  partial_id_ranges_trimmed = [
      (max(start_id, min_id), min(end_id, max_id)) for start_id, end_id in partial_id_ranges
  ]
  return partial_id_ranges_trimmed
partial_id_ranges = get_id_ranges(min_id, max_id, id_stride)

# Make a list of request bodies
request_bodies = [{
    "minId": start_id,
    "maxId": end_id,
    **request_body_base
} for start_id, end_id in partial_id_ranges]

print(f"Sending {len(request_bodies)} requests to {base_url}...")

async def fetch(session, url, data):
    # return f"Sending request to {url} with data {data}"
    async with session.post(url, json=data, headers={"Content-Type": "application/json"}) as response:
        return await response.text()

async def main():
    # Create a session and run the POST requests
    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch(session, base_url, request_body) 
            for request_body in request_bodies
        ]
        responses = await asyncio.gather(*tasks)
        for response in responses:
            print(response)

# Run the main function
asyncio.run(main())



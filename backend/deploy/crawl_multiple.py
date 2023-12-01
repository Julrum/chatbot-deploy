import pandas as pd
import asyncio
import aiohttp

base_url = "https://crawler-z5eqvjec2q-uc.a.run.app/crawl"

request_body_base = {
    "maxPage": 1000,
    "maxRetry": 3,
    "host": "http://10.128.0.4",
    "port": 8000,
    "collectionName": "crawl-remote-test",
    "maxContentLength": 200,
    "maxRecursionDepth": 3
}
start_date = "2023-09-01"
end_date = "2023-12-31"
start_dates = pd.date_range(start=start_date, end=end_date, freq="MS").strftime("%Y-%m-%d").tolist()
end_dates = pd.date_range(start=start_date, end=end_date, freq="M").strftime("%Y-%m-%d").tolist()
# Make a list of request bodies
request_bodies = [{
    "startDate": start_date,
    "endDate": end_date,
    **request_body_base
} for start_date, end_date in zip(start_dates, end_dates)]

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



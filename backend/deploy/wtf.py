from requests import get
from tqdm import tqdm

base_url = "https://startup.hanyang.ac.kr/board/notice/view/{id}?boardName=notice"
urls = [base_url.format(id=i) for i in range(3000, 2500, -1)]

fail_urls = []
for url in tqdm(urls):
    res = get(url)
    if (res.status_code != 200):
        fail_urls.append(url)

print(f"Failed to get {len(fail_urls)} urls")
print(fail_urls)
print(f"Success rate: {100 - len(fail_urls) * 100 / len(urls)}")


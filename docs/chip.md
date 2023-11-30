# Chip Type
## Description
Chip Type은 사용자가 선택할 수 있는 버튼을 제공한다.
칩에 표시되는 텍스트(`text`)와, 클릭 시 전달되는 응답(`response`)을 포함한다.
`response` 는 `type`과 `payload`로 구성된다.
`type`은 응답의 타입을 나타내며, `payload`는 응답의 내용을 나타낸다.
`payload`는 `type`에 따라 다른 필드를 가진다.
`response`의 `type`은 `text`, `url_preview` 중 하나이다.
`payload` 의 필드는 chat_api.md의 `response`와 동일하다.

## Example1
```json
{
    "id": "1234",
    "text": "찾아오시는 길",
    "response": {
        "type": "text",
        "payload": {
            "text": "서울특별시 성동구 왕십리로 222 한양대학교 서울캠퍼스"
        }
    }
}
```
## Example2
```json
{
    "id": "1234",
    "text": "정시 요강",
    "response": {
        "type": "url_preview",
        "payload": {
            "title": "한양대학교",
            "description": "2024학년도 정시모집요강",
            "url": "https://www.hanyang.ac.kr/web/www/-107",
            "image_url": "https://www.hanyang.ac.kr/web/www/-107",
        }
    }
}
```
# GET /chip
`website_id`에 속한 `chip_id` 의 칩을 반환한다.
## parameter
| parameter | type | description |
| --- | --- | --- |
| website_id | string | 웹사이트의 고유 ID |
| chip_id | string | 칩의 고유 ID |

## response
### 200 OK
```json
{
    "status_description": "chip is returned",
    "chip": {
        "id": "1234",
        "text": "찾아오시는 길",
        "response": {
            "type": "text",
            "payload": {
                "text": "서울특별시 성동구 왕십리로 222 한양대학교 서울캠퍼스"
            }
        }
    }
}
```
### 400 Bad Request
```json
{
    "status_description": "website_id is not provided"
}
```
### 404 Not Found
```json
{
    "status_description": "website_id=1234567890 not found"
}
```
```json
{
    "status_description": "chip not found"
}
```
# POST /chip
`website_id`에 속한 `chip_id` 의 칩을 등록한다.
## Request Body
```json
{
    "website_id": "1234567890",
    "chip": {
        "text": "찾아오시는 길",
        "response": {
            "type": "text",
            "payload": {
                "text": "서울특별시 성동구 왕십리로 222 한양대학교 서울캠퍼스"
            }
        }
    }
}
```
## response
### 200 OK
```json
{
    "status_description": "chip is registered",
    "chip_id": "1234"
}
```
### 400 Bad Request
```json
{
    "status_description": "website_id is not provided"
}
```
### 404 Not Found
```json
{
    "status_description": "website_id=1234567890 not found"
}
```

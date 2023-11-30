# Prompt API
Prompt API는 웹사이트 별로 prompt를 관리하는 API이다.

# Prompt Type
OpenAI API에 전달 될 prompt의 형식을 정의한다.
## Fields
| Name | Type | Description |
| ---- | ---- | ----------- |
| id | string | prompt의 고유 ID |
| version | integer | prompt의 버전. 최신 버전일수록 값이 더 크다 |
| role | string | prompt 작성자의 role (user, assistant, system 중 하나) |
| created_at | string | prompt가 생성된 일시 (ISO Format) |
| content | string | prompt의 내용 |

## Example 
```json
{
    "id": "1234567890",
    "version": 12,
    "role": "system",
    "created_at": "2021-01-01T00:00:00Z",
    "content": "You are an assistant who finds information of Hanyang University's bachelor administration. NEVER GUESS things that you don't know."
    "
}
```

# GET /prompt
`website_id`에 해당하는 웹사이트의 prompt를 반환한다.
| parameter | type | description |
| --- | --- | --- |
| website_id | string | 웹사이트의 고유 ID |
| version | integer | prompt의 버전. 최신 버전일수록 값이 더 크다.|
> version 값은 -1 이상의 정수이다. 실제 레코드의 version 값은 0부터 시작하며, request의 version 값이 -1이면 최신 버전의 prompt를 반환한다.

## response
### 200 OK
```json
{
    "status_description": "prompt is returned",
    "prompt": {
        "id": "1234567890",
        "version": 12,
        "role": "system",
        "created_at": "2021-01-01T00:00:00Z",
        "content": "You are an assistant who finds information of Hanyang University's bachelor administration. NEVER GUESS things that you don't know."
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
    "status_description": "prompt not found"
}
```

# POST /prompt
`website_id`에 해당하는 웹사이트의 prompt를 최신 버전으로 등록한다.

## Request Body
```json
{
    "website_id": "1234567890",
    "role": "system",
    "content": "You are an assistant who finds information of Hanyang University's bachelor administration. NEVER GUESS things that you don't know."
}
```
## Response
### 200 OK
```json
{
    "status_description": "prompt is created",
    "prompt": {
        "id": "1234567890",
        "version": 12,
        "role": "system",
        "created_at": "2021-01-01T00:00:00Z",
        "content": "You are an assistant who finds information of Hanyang University's bachelor administration. NEVER GUESS things that you don't know."
    }
}
```
### 400 Bad Request
```json
{
    "status_description": "website_id is not provided"
}
```
```json
{
    "status_description": "role is not provided"
}
```
```json
{
    "status_description": "Expected role to be one of ['user', 'assistant', 'system'] but got 'admin'"
}
```
```json
{
    "status_description": "content is not provided"
}
```
### 404 Not Found
```json
{
    "status_description": "website_id=1234567890 not found"
}
```

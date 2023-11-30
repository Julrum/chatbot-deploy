
# GET /session
`website_id`에 해당하는 웹사이트 내에 `session_id` 에 해당하는 세션의 존재 여부를 확인한다.
존재하면 `200 OK` 를, 존재하지 않으면 `404 Not Found` 를 반환한다.
## Query Parameters
| Name | Type | Description |
| ---- | ---- | ----------- |
| session_id | string | session id |
| website_id | string | website id |

## response
### 200 OK
```json
{
    "status_description": "session is valid"
}
```
### 404 Not Found
```json
{
    "status_description": "session 1234567890 is not found"
}
```

# POST /session
`website_id` 에 속하는 새로운 세션을 생성한다.
`session_id`가 이미 존재하면 `409 Conflict` 를 반환하고, 해당 요청은 무시한다.
## body
```json
{
    "website_id": "1234567890",
}
```
## response
### 200 OK
```json
{
    "status_description": "session created",
    "session_id": "1234567890"
}
```
### 404 Not Found
```json
{
    "status_description": "website with id 1234567890 not found"
}
```
### 409 Conflict
```json
{
    "status_description": "session with id 1234567890 already exists"
}
```

# DELETE /session
`website_id`에 속한 `session_id` 에 해당하는 세션을 삭제한다.
존재하지 않는 `website_id` 또는 `session_id` 를 요청하면 `404 Not Found` 를 반환하고, 해당 요청은 무시한다.
## body
```json
{
    "website_id": "1234567890",
    "session_id": "1234567890"
}
```
## response
### 200 OK
```json
{
    "status_description": "session with id 1234567890 deleted"
}
```
### 404 Not Found
```json
{
    "status_description": "session with id 1234567890 not found"
}
```

# GET /messages
`website_id`에 속한 `session_id` 에 해당하는 세션의 메시지들을 모두 가져온다.
`message`의 subtype에 해당하는 객체들의 리스트를 `"messages"` 필드에 담아 반환한다.
## Query Parameters
| Name | Type | Description |
| ---- | ---- | ----------- |
| website_id | string | website id |
| session_id | string | session id |
## response
### 200 OK
```json
{
    "status_description": "Found 3 messages in session 1234567890",
    "messages": [
        {
            "id": "1234567890",
            "created_at": "2020-01-01T00:00:00Z",
            "role": "user",
            "type": "text",
            "payload": {
                "text": "hello"
            }
        },
        {
            "id": "1234567891",
            "created_at": "2020-01-01T00:00:01Z",
            "role": "assistant",
            "type": "text",
            "payload": {
                "text": "hi, how can I help you?"
            }
        },
        {
            "id": "1234567892",
            "created_at": "2020-01-01T00:00:02Z",
            "role": "assistant",
            "type": "chip",
            "payload": {
                "chip_ids": [
                    "1234567893", 
                    "1234567894"
                ]
            }
        }
    ]
}
```
### 404 Not Found
```json
{
    "status_description": "session with id 1234567890 not found"
}
```
# POST /message
`website_id`에 속한 `session_id` 에 해당하는 세션에 새로운 메시지를 추가한다.
## body
```json
{
    "website_id": "1234567890",
    "session_id": "1234567890",
    "message": {
        "role": "user",
        "type": "text",
        "payload": {
            "text": "hello"
        }
    }
}
```
## response
### 200 OK
```json
{
    "status_description": "message added",
    "message_id": "1234567890"
}
```
### 404 Not Found
```json
{
    "status_description": "session with id 1234567890 not found"
}
```
# GET /reply
`website_id`에 속한 `session_id` 에 해당하는 세션의 메시지들 중, `message_id` 에 대한 답변을 가져온다.
`message`의 subtype에 해당하는 객체들의 리스트를 `messages` 필드에 담아 반환한다.
## Query Parameters
| Name | Type | Description |
| ---- | ---- | ----------- |
| website_id | string | website id |
| session_id | string | session id |
| message_id | string | message id |
## response
### 200 OK
```json
{
    "status_description": "Created 1 reply for message 1234567890 in session 1234567890",
    "messages": [
        {
            "id": "1234567891",
            "created_at": "2020-01-01T00:00:01Z",
            "role": "assistant",
            "type": "text",
            "payload": {
                "text": "hi, how can I help you?"
            }
        }
    ]
}
```
### 404 Not Found
```json
{
    "status_description": "session with id 1234567890 not found"
}
```
```json
{
    "status_description": "message with id 1234567890 not found"
}
```

# Common Errors
## 400 Bad Request
```json
{
    "status_description": "error description",
}
```
## 500 Internal Server Error
```json
{
    "status_description": "error description",
}
```

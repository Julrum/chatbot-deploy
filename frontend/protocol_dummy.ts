// backend/protocol.py와 동일한 protocol을 TypeScript로 구현한 샘플
// Chat GPT가 생성한 코드이므로, 적절히 수정해서 사용할 것.
// 모호한 부분은 rest_api.md 에 명시된 내용을 따른다.

// Enums
// 원래의 Python 버전에서는 StrEnum을 사용했지만, TypeScript에서는 이를 지원하지 않아서
// number 값에 대응되는 enum을 사용.
// API 통신을 위해서는 enum의 이름의 lowercase string을 대응시켜서 사용해아 함.
// 예) StatusCode.OK -> 'ok'
//    MessageType.TEXT -> 'text'
//    MessageRole.USER -> 'user'
enum StatusCode {
    OK,
    SESSION_NOT_FOUND,
}

enum MessageType {
    TEXT,
    CHIP,
    URL_PREVIEW,
    HUMAN_FALLBACK,
}

enum MessageRole {
    USER,
    ASSISTANT,
}

// Interfaces for Payloads
interface BasePayload {}

interface EmptyPayload extends BasePayload {}

interface TextPayload extends BasePayload {
    text: string;
}

interface ChipPayload extends BasePayload {
    chipIds: number[];
}

interface UrlPreviewPayload extends BasePayload {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
}

interface HumanFallbackPayload extends BasePayload {
    email: string;
    phone: string;
    name: string;
    content: string;
}

// Message Interface
interface Message {
    id: number | null;
    sessionId: number;
    createdAt: Date;
    role: MessageRole;
    type: MessageType;
    payload: BasePayload;
}

// Serialization & Deserialization Functions (simplified examples)
function serializePayload(payload: BasePayload, type: MessageType): Record<string, any> {
    switch (type) {
        case MessageType.TEXT:
            return {
                text: (payload as TextPayload).text,
            };
        // ... other cases
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}

function deserializePayload(payload: Record<string, any>, type: MessageType): BasePayload {
    switch (type) {
        case MessageType.TEXT:
            return {
                text: payload['text'],
            } as TextPayload;
        // ... other cases
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}

// Example usage for serialize/deserialize functions
function serializeMessage(message: Message): Record<string, any> {
    return {
        id: message.id,
        sessionId: message.sessionId,
        createdAt: message.createdAt.toISOString(),
        role: message.role,
        type: message.type,
        payload: serializePayload(message.payload, message.type),
    };
}

function deserializeMessage(message: Record<string, any>): Message {
    return {
        id: message['id'],
        sessionId: message['sessionId'],
        createdAt: new Date(message['createdAt']),
        role: message['role'] as MessageRole,
        type: message['type'] as MessageType,
        payload: deserializePayload(message['payload'], message['type'] as MessageType),
    };
}

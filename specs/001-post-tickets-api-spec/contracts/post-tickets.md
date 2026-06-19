# Contract: POST /api/tickets

> SSOT: `docs/API_SPEC.md §4-2` | **Status**: ✅ 구현 완료 (서버 측)

---

## 엔드포인트

```
POST /api/tickets
Content-Type: application/json
```

## 요청

```json
{
  "title": "string (필수, 1~255자)",
  "description": "string (선택)",
  "priority": "Low | Medium | High (선택)",
  "startedAt": "ISO 8601 datetime (선택)",
  "dueDate": "ISO 8601 datetime (선택)"
}
```

## 성공 응답 — HTTP 201

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "Backlog",
  "priority": "Low | Medium | High | null",
  "order": 1000,
  "startedAt": "ISO 8601 | null",
  "dueDate": "ISO 8601 | null",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

## 에러 응답

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | `title` 누락·길이 초과, `priority` 허용값 외, 날짜 형식 오류 | `{ "error": "Validation failed", "details": { "필드명": ["메시지"] } }` |
| 500 | DB 삽입 실패 등 서버 내부 오류 | `{ "error": "Internal server error", "details": {} }` |

## 서버 자동 할당 규칙

- `status`: 항상 `"Backlog"` (클라이언트 값 무시)
- `order`: `MAX(Backlog.order) + 1000`, 최초 삽입 시 `1000`

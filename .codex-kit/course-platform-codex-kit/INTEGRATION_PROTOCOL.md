# Course Platform Integration Protocol 1.0

## 1. Назначение

Протокол связывает Course Platform с любым внешним приложением: Calendar, LMS, CRM, корпоративным порталом или сайтом. Платформа не должна содержать Calendar-специфичную бизнес-логику.

## 2. Каналы интеграции

1. **Integration API** — каталог курсов, структура и создание embed-сессии.
2. **iframe Player** — прохождение конкретного урока.
3. **postMessage** — мгновенные UI-события во время открытого iframe.
4. **Webhooks** — надёжная серверная синхронизация.

## 3. Создание embed-сессии

Внешний backend вызывает:

```http
POST /functions/v1/embed-session-create
Authorization: Bearer cp_live_<secret>
Content-Type: application/json
```

```json
{
  "externalUserId": "calendar-user-123",
  "displayName": "User",
  "email": "optional@example.com",
  "courseId": "uuid",
  "lessonId": "uuid",
  "origin": "https://calendar.example.com",
  "externalContextId": "calendar-event-123",
  "metadata": {}
}
```

Ответ:

```json
{
  "embedUrl": "https://courses.example.com/embed/lessons/<lessonId>",
  "sessionToken": "opaque-random-token",
  "expiresAt": "2026-07-18T20:00:00Z"
}
```

`sessionToken` не помещается в URL. Внешний frontend передаёт его iframe только после сообщения `COURSE_PLAYER_READY`.

## 4. Общая форма сообщения

```ts
interface CourseEmbedMessage<T = unknown> {
  namespace: 'course-platform'
  version: '1.0'
  type: string
  requestId?: string
  payload: T
}
```

Все сообщения валидируются Zod-схемами.

## 5. Инициализация Player

### Player → Parent

```ts
window.parent.postMessage(
  {
    namespace: 'course-platform',
    version: '1.0',
    type: 'COURSE_PLAYER_READY',
    payload: {},
  },
  expectedParentOrigin,
)
```

### Parent → Player

```ts
iframe.contentWindow?.postMessage(
  {
    namespace: 'course-platform',
    version: '1.0',
    type: 'COURSE_PLAYER_INIT',
    payload: {
      sessionToken,
      parentOrigin: window.location.origin,
      theme: 'light',
      locale: 'ru',
    },
  },
  'https://courses.example.com',
)
```

Player обязан проверить:

- `event.source === window.parent`;
- точное значение `event.origin`;
- namespace и protocol version;
- соответствие origin embed-сессии;
- срок действия и отзыв token.

Token хранится только в памяти и очищается при закрытии Player.

## 6. Player → Parent

Поддержать события:

- `COURSE_PLAYER_READY`;
- `COURSE_LESSON_LOADED`;
- `COURSE_LESSON_STARTED`;
- `COURSE_LESSON_PROGRESS`;
- `COURSE_LESSON_COMPLETED`;
- `COURSE_LESSON_ERROR`;
- `COURSE_PLAYER_HEIGHT`;
- `COURSE_PLAYER_CLOSE_REQUEST`.

Прогресс:

```json
{
  "namespace": "course-platform",
  "version": "1.0",
  "type": "COURSE_LESSON_PROGRESS",
  "payload": {
    "courseId": "uuid",
    "releaseId": "uuid",
    "lessonId": "uuid",
    "externalContextId": "calendar-event-123",
    "progressPercent": 64,
    "completedBlocks": 7,
    "totalBlocks": 11,
    "score": 8,
    "maxScore": 10
  }
}
```

Завершение:

```json
{
  "namespace": "course-platform",
  "version": "1.0",
  "type": "COURSE_LESSON_COMPLETED",
  "payload": {
    "courseId": "uuid",
    "releaseId": "uuid",
    "lessonId": "uuid",
    "externalContextId": "calendar-event-123",
    "progressPercent": 100,
    "scorePercent": 87,
    "completedAt": "ISO_DATE"
  }
}
```

## 7. Parent → Player

- `COURSE_PLAYER_INIT`;
- `COURSE_PLAYER_THEME`;
- `COURSE_PLAYER_LOCALE`;
- `COURSE_PLAYER_FOCUS`;
- `COURSE_PLAYER_CLOSE`.

## 8. Webhooks

События:

- `learner.created`;
- `enrollment.created`;
- `lesson.started`;
- `lesson.progress`;
- `lesson.completed`;
- `course.completed`.

Заголовки:

```http
X-Course-Event-Id: <uuid>
X-Course-Timestamp: <unix-seconds>
X-Course-Signature: <hex-hmac-sha256>
```

Строка подписи:

```text
<timestamp>.<rawBody>
```

Получатель проверяет timestamp, HMAC constant-time сравнением и дедуплицирует событие по event id.

Рекомендуемый retry schedule: 1 минута, 5 минут, 30 минут, 2 часа, 12 часов.

## 9. Идемпотентность

Все mutation-endpoints принимают `requestId`. Повторный запрос с тем же `requestId` возвращает прошлый результат и не создаёт второй ответ, attempt или webhook.

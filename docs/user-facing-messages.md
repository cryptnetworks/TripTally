# User-Facing Messages

TripTally keeps technical errors in server logs and shows concise, safe messages in the UI.

## Adding a Message

Add shared copy in `lib/user-messages.ts`.

- Redirect/query messages use `queryFeedback(scope, code)`.
- API errors use `apiError(code, status)` from `lib/api-response.ts`.
- Activity feed entries use `formatActivityMessage(entry)`.

Prefer short plain-English copy:

```ts
queryFeedback("trip", "forbidden");
apiError("FORBIDDEN", 403);
```

Do not show stack traces, Prisma errors, Zod internals, raw HTTP status text, SQL errors, or internal IDs to users.

## Showing Messages

Use `FeedbackAlert` for visible UI feedback. It sets accessible roles automatically:

- `role="alert"` for errors
- `role="status"` for success/info messages

Place form-specific validation messages near the form. Place global page failures near the page header.

## Testing

Add unit tests for message mappings in `tests/unit/user-messages.test.ts`.
Add UI rendering checks for alerts in `tests/unit/feedback-alert.test.ts`.
Add E2E assertions for important flows so success and error messages stay visible on desktop and Mobile Safari projects.

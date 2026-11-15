# OpenRouter reply fixtures

Chat Completions replies in the shapes OpenRouter documents, served by the local
stub in `test/support/openrouter-stub.ts`. No test calls OpenRouter or a model.
None of these came from a live call: each is written from the documented shape so
that it needs no API key.

- Response shape, `finish_reason` values, `usage`:
  https://openrouter.ai/docs/api-reference/overview
- Refusals (`message.refusal` with `finish_reason: "content_filter"`, or a 403
  whose `error.metadata.error_type` is `refusal`) and errors in a 200 body:
  https://openrouter.ai/docs/api_reference/errors-and-debugging

| File | What it is |
|---|---|
| `valid-description.json` | a batched `description` reply for `barbell-bench-press` and `push-up` |
| `refusal.json` | the model declines as its own output |
| `refusal-403.json` | the provider reports the refusal as an error |
| `length.json` | the reply stops at `max_tokens`, mid-JSON |
| `schema-invalid.json` | well-formed JSON that fails the request schema: an exercise that was not in the batch and a field nobody asked for |
| `error-200.json` | a 200 whose body holds only an `error` |

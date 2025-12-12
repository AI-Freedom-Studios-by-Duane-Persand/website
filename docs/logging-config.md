# Logging & Config Strategy

## Log File Location
- All backend logs are written to `/api/logs/api.log`.
- Log levels: `info`, `debug`, `error`.

## Sensitive Data Redaction
- Do not log secrets, passwords, or PII.
- Debug logs for JWT show only the secret name, not the value.

## Config Management
- All secrets and configs are stored in `.env`.
- Never hard-code secrets in code.
- Use `process.env` to access configs in backend.

## Debug Logging
- Enable debug logs by setting log level to `debug` in Winston config.
- Debug logs include authentication flow, JWT verification, and errors.

## How to Enable/Disable Debug Logging
- Change log level in `api/src/logger.ts` Winston config.
- Restart backend to apply changes.

---
For more details, see the main implementation plan in `/docs`.

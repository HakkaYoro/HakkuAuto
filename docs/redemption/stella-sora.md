# Stella Sora — Redemption API (stellasora.global/gift)

Reverse-engineered from the official SPA bundle
(`https://novaweb-usstatic.yo-star.com/h5/assets/main-b362279f.js` + `Gift-50403d78.js`)
on 2026-11-02. **No captcha on the gift flow** (TCaptcha is loaded globally but only
used by the pre-registration email flow).

## Endpoints

Base: `https://stellasora.global/api/` (JSON).

| Endpoint | Purpose |
|---|---|
| `GET game/info?sdkuid={uid}` | Verify account: returns `player_nickname`, `player_level` |
| `POST game/redeem` | Redeem a gift code |

Response envelope: `{code, message, data, timestamp}`.

- `GET game/info` → `data.player_nickname` empty ⇒ account unknown/not created yet.
- `POST game/redeem` body `{uid, code}`:
  - `code === 0` ⇒ success.
  - `code !== 0` ⇒ error; user message in `message` (+ optional `data.sdkErrorCode`).
  - HTTP error with `code: 1011` ⇒ rate-limited / temporary (retry with backoff, or
    NEEDS_MANUAL if persistent).

## Form validation (from Gift-50403d78.js)

- `uid`: string, length ≥ 9.
- `code`: `^[A-Z0-9]{1,20}$` (uppercased, non-alphanumerics stripped).
- No server field: UID is globally unique.

## Notes

- Rewards arrive via in-game mail; each code is once per account.
- Rate limiting is enforced (1011). The application layer's courtesy delay applies.

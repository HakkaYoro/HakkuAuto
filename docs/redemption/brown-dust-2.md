# Brown Dust 2 — Coupon endpoints

Reverse-engineered on 2026-11-02 from **BD2-Archive** (MIT,
[github.com/rm6alalauau/BD2-Archive](https://github.com/rm6alalauau/BD2-Archive)) — the public
redemption service behind [thebd2pulse.com](https://thebd2pulse.com) — and from the BD2DB SPA
bundles (`assets/main-CPU9EKNG.js` + `assets/HomeView-C16xbwGz.js`,
[browndust2-db.souseha.com](https://browndust2-db.souseha.com/en/)). **No captcha on the flow.**

## Redemption endpoint (thebd2pulse)

`POST https://api.thebd2pulse.com/redeem/coupon` (JSON)

Headers: `Origin: https://thebd2pulse.com`, `Referer: https://thebd2pulse.com/en/`.

Body: `{"appId":"bd2-live","userId":"<nickname>","code":"<code>"}` — redemption is by
in-game nickname only, no server selection.

- `{success: true}` ⇒ redeemed.
- `{success: false, errorCode}` ⇒ classified:

| errorCode | HakkuAuto status |
| --- | --- |
| `AlreadyUsed` | `ALREADY_USED` |
| `InvalidCode` | `INVALID_CODE` |
| `ExpiredCode` | `EXPIRED` |
| `IncorrectUser` | `FAILED` (misspelled nickname) |
| anything else | `FAILED` |
| HTTP 429 | `NEEDS_MANUAL` (rate-limited, retry later) |

## Code source (BD2DB)

`GET https://api-browndust2-wiki.souseha.com/coupon` — JSON, no auth, no params (verified
2026-11-02 with plain curl, HTTP 200):

```json
{
  "success": true,
  "data": [
    {
      "id": "ecb8153d-0ca5-4cc5-95ca-babe9285f97f",
      "code": "2026BD2NOV",
      "content": "抽抽樂券 x3",
      "content_CN": "抽抽乐券 x3",
      "content_en": "Draw Ticket(s) x3",
      "content_ja": "ガチャ券 x3",
      "content_ko": "뽑기권 x3",
      "startDate": null,
      "endDate": 1796054340000,
      "createdAt": 1793520940524,
      "updatedAt": 1793520940524
    }
  ]
}
```

- `data[]`: `code` (string), `content_en` / `content` (localized reward text — HakkuAuto uses
  `content_en`, falls back to `content`), `endDate` epoch **ms** or `null` (never expires).
- Expired codes are filtered server-side (the API no longer returns them).

## Manual assist

The official page ([redeem.bd2.pmang.cloud/bd2/index.html](https://redeem.bd2.pmang.cloud/bd2/index.html))
is linked from the UI as the manual-assist fallback.

## Notes

- Rewards arrive via the in-game mailbox; restart the game to see them.
- Case risk: `GameCode.discover` uppercases every code (`src/domain/codes/game-code.ts`),
  while BD2DB lists codes as published (e.g. `Waiting4legend`). A lowercase-published code
  would fail if the redemption API were case-sensitive. Accepted risk — no lowercase code
  has been published so far.

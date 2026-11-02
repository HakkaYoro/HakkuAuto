# Blue Archive — Redemption API (mcoupon.nexon.com)

Reverse-engineered from the official page's JS (`https://mcoupon.nexon.com/js/action.js`,
`common.js`, `resource.js`) on 2026-11-02. No captcha on this flow (SMS auth only
guards the separate "coupon lookup" tab, which we never use).

## Endpoints

Base: `https://mcoupon.nexon.com/bluearchive/coupon/api/v1/` (JSON body, `Content-Type: application/json`).

| Endpoint | Purpose |
|---|---|
| `POST characters-by-npacode` | Validate member code + coupon, list characters of the account |
| `POST redeem-coupon-by-npacode` | Redeem the coupon on a chosen character |
| `POST game-servers-by-npacode` | (unused by us) server list |

## Flow

1. `characters-by-npacode` with `{npaCode, coupon, region}` → `data.result: true`,
   `data.info` = character list (items carry `id`, `name`, `world`).
2. `redeem-coupon-by-npacode` with `{npaCode, coupon, id, name, world, region}` →
   `data.code === 0` = success (`data.info` may carry extra reward text; `1171` =
   success with bonus granted).

Field rules (from page validators):
- `npaCode` (member code): alphanumeric, **12–13 chars**.
- `coupon`: 4–42 chars, always sent **UPPERCASE**.
- `region`: one of `kr | na | tw | asia | global` (page config `$.regions`).

## Error code mapping (source: `common.js` getErrorMessageByCode + resource.js)

| Code | Meaning | HakkuAuto status |
|---|---|---|
| `0` / `1171` | success (1171 = with extra reward) | SUCCESS |
| `95100`, `90434` | already used | ALREADY_USED |
| `95550` | already applied to that character | ALREADY_USED |
| `95170`, `95150`, `95120` | usage count exhausted | ALREADY_USED |
| `95130` | coupon expired | EXPIRED |
| `94202` | invalid coupon number | INVALID_CODE |
| `95110` | coupon issued to someone else | INVALID_CODE |
| `95160`, `90433` | coupon not usable in this game | INVALID_CODE |
| `90435` | social-link required | FAILED |
| `90437` | wrong server/world selection | FAILED (config error) |
| `94201`, `94204`, `90421`, `95190`, `5001` | invalid member code / user | FAILED (config error) |
| `95030–95033` | game maintenance | FAILED (retry later) |
| other | unexpected | FAILED |

## Adapter notes

- A BA account stores: `region` (server), `memberCode` (npaCode), optional
  `characterName` filter. If several characters match, the adapter picks the first
  returned (the official page makes the user choose).
- Courtesy delay between redemptions of the same game (application layer does this).

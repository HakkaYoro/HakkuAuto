# Goddess of Victory: NIKKE — CDK endpoints

Reverse-engineered on 2026-11-03 from **Small-tailqwq/Nikke-CDK-Tool** (MIT,
[github.com/Small-tailqwq/Nikke-CDK-Tool](https://github.com/Small-tailqwq/Nikke-CDK-Tool),
worker snapshots `a78498313e` / `e7e08ee10b`) — [BlaBlaLink](https://www.blablalink.com) is the
Level Infinite web portal behind the in-game CD-Key Redemption Portal. The captcha lives
**only in the browser login**; HakkuAuto never automates login or captcha — the user pastes
their web session cookie, and the redemption API itself needs no signature.

## Redemption endpoint (BlaBlaLink)

`POST https://api.blablalink.com/api/game/proxy/Game/RecordCdkRedemption` (JSON)

Headers:

```
Origin: https://www.blablalink.com
Referer: https://www.blablalink.com/
x-channel-type: 2
x-language: en
x-common-params: {"game_id":"16","area_id":"global","source":"pc_web","intl_game_id":"29080","language":"en","env":"prod"}
Cookie: <the player's web session cookie, verbatim>
```

`x-common-params` is a JSON string packed into a single header. The cookie carries
`game_token=`, `game_openid=`, `game_uid=`, `game_channelid=`, `game_gameid=`,
`game_user_name=` pairs. Body: `{"cdkey":"<code>"}` — single field, no server selection
(the cookie identifies the player).

Response `{code, msg}`; `code === 0` ⇒ redeemed. Error mapping:

| code | Meaning | HakkuAuto status |
| --- | --- | --- |
| `0` | success | `SUCCESS` |
| `1302016` | already redeemed by this account (该账号已兑换过此CDK) | `ALREADY_USED` |
| `1302015` | invalid CDK (CDK无效) | `INVALID_CODE` |
| `1302017` | global uses exhausted (CDK使用次数已耗尽) | `EXPIRED` |
| `1302009` | account redemption limit reached (CDK兑换次数已达上限) | `FAILED` (transient — retried next pass) |
| `300001` | not logged in / cookie expired (游戏未登录; msg `game not login`) | `NEEDS_MANUAL` — re-login and update the cookie |
| anything else | — | `FAILED` |
| HTTP 429 | rate-limited | `NEEDS_MANUAL` (retry later) |

## Account verify endpoint

`POST https://api.blablalink.com/api/ugc/direct/standalonesite/User/GetUserGamePlayerInfo`
(same `x-*` + `Origin`/`Referer` + `Cookie` headers)

Body: `{"intl_openid":"<game_gameid>-<game_openid>"}` — both values are pulled from the
cookie with `game_gameid=([^;]+)` / `game_openid=([^;]+)` (`game_gameid` falls back to
`29080`). `code === 0 && data` ⇒ the cookie is live; `data.area_id` names the region
(Global/Japan/Korea/NA/SEA) and is shown as-is.

## Code source (Nikke-CDK-Tool)

`GET https://raw.githubusercontent.com/Small-tailqwq/Nikke-CDK-Tool/HEAD/public/cdk-list.source.json`
(verified 2026-11-03 with plain curl, HTTP 200):

```json
{
  "version": 2.5,
  "lastUpdate": "2026-11-03T02:45:25.000Z",
  "cdks": [
    {
      "type": "group",
      "groupId": "STELLAR_BLADE_01",
      "groupName": "Nikke X 剑星",
      "cdks": [
        {
          "code": "NIKKESTELLARBLADE",
          "name": "剑星联动纪念SP生放送奖励",
          "reward": "高级招募券×5, 成长套件：24H×1, ...",
          "servers": ["global"],
          "status": "已过期",
          "note": "...",
          "author": "Small-tailqwq",
          "created": "2025-06-07"
        }
      ]
    }
  ]
}
```

- `cdks[]` mixes code nodes and `{type:"group", cdks}` nodes that nest recursively.
- Filter: non-empty `code` string **and** `servers` includes `"global"` **and**
  `status === "可用"` (active). 72 codes total → 22 global+active on 2026-11-03.
- No structured expiry date → `expiresAt` is never set; `已过期` is the only expiry signal.
- `reward` is display text in Chinese, passed through verbatim.

## Manual assist

The [BlaBlaLink CDK page](https://www.blablalink.com/cdk) is linked from the UI as the
manual-assist fallback. Fully in-game alternative: **Notice → Event Notice → CD-Key
Redemption Portal** (unlocks at Stage 1-4); rewards arrive in the mailbox.

## Notes

- Case risk: NIKKE CDKs are case-insensitive, but `GameCode.discover` uppercases every code
  (`src/domain/codes/game-code.ts`) while the source lists codes as published (e.g.
  `millioncommanders`). Accepted risk, same as Brown Dust 2 — redemption still succeeds
  because the server ignores case.
- The session cookie expires: `300001` responses map to `NEEDS_MANUAL` asking the user to
  re-login on blablalink.com and paste a fresh cookie.
- Global server only. `tw`/`cn` codes are filtered out — the CN flow additionally requires an
  AMS captcha and is out of scope for automation.
- Rewards reach the in-game mailbox (24h retention on some items) — the plugin does not
  claim them.

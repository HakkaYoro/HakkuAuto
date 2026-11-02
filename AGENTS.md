# AGENTS.md — HakkuAuto

Gacha game gift-code scraper + auto-redeemer. Scrapes codes (Blue Archive, Stella Sora, ...),
shows them in a themed WebUI, and redeems them automatically to configured game accounts.

## Stack

- **Backend**: NestJS 12 (composition root in `src/app.module.ts`), Node ≥ 26
  (stdlib `node:sqlite` + built-in `fetch` — no native deps), TypeScript strict.
- **WebUI**: React 19 + Vite + Tailwind v4 + react-i18next, inside `webui/`.
  Built into `dist/webui` and served by the Nest process (one image, one container).
- **Deploy**: Docker (`Dockerfile` multi-stage + `docker-compose.yml`, SQLite in `/data` volume).

## Architecture rules (clean DDD + hexagonal — non-negotiable)

Dependencies point inward only:

```
presentation/  infrastructure/   →  application/  →  domain/
(Nest controllers,             (use cases + ports      (aggregates, VOs,
 static serving)                driven by interfaces)    zero framework imports)
```

- `src/domain/` — pure TypeScript. No Nest, no fetch, no sqlite. Aggregates enforce invariants.
- `src/application/` — plain-class use cases + driven ports (`ports/driven/*`). No Nest decorators.
  Nest wiring happens via token providers in `app.module.ts` (`useFactory`), never `@Injectable()` on use cases.
- `src/infrastructure/` — SQLite repositories, HTTP plugins, scheduler, adapters. Implements ports.
- `src/presentation/` — controllers (driver adapters), DTOs (class-validator), domain-error → HTTP filter.
- Use-case driver port = its public `execute()` (small codebase exception; keep it that way until seams grow).

## Adding a game (the only supported way)

Create `src/infrastructure/games/<game-id>/`:

1. `definition.ts` — `GameDefinition`: id (kebab slug), name, official `redemptionUrl`,
   `servers`, `accountFields` (schema validated by `domain/accounts/credentials.ts`),
   `theme` (accent colors, official art URLs), `enabled`.
2. Source adapter — `<source>.ts` exporting `async fetchCodes(): Promise<ScrapedCodeEntry[]>`
   (pure function; use `infrastructure/http/http.ts` helpers).
3. Redemption adapter — `<gateway>.ts` with `redeem(account, code): Promise<RedemptionResult>`
   (+ `verify(input)` for the account-setup live check). Map provider errors to `RedemptionStatus`.
4. `plugin.ts` — assemble the `GamePlugin` and register it in `app.module.ts`
   (`new GameRegistry([blueArchivePlugin, stellaSoraPlugin, ...])`).
5. Optional WebUI polish: `webui/src/games/registry.tsx` entry (guide component, art).
   The generic UI already themes itself from the definition; nothing else to touch.

### Game art (copyright rule)

`theme.bannerUrl`/`theme.logoUrl` must be **hotlinked URLs from official CDNs** (game key
visuals, store listing icons) — **never commit game images to the repo**. When a game ships
new season/anniversary art (Mihoyo-style promo art), refresh the URLs in that plugin's
`definition.ts` (one line each). Good sources: the official site's `og:image`, Steam
`library_hero.jpg` (`cdn.cloudflare.steamstatic.com/steam/apps/<appid>/library_hero.jpg`),
Play Store listing icon (the `play-lh.googleusercontent.com` og:image of the store page).
The UI degrades to a themed gradient if a URL dies.

Document the reverse-engineered redemption endpoints in `docs/redemption/<game-id>.md`.

## Commands

```
npm run dev        # tsc watch + node --watch + vite dev (proxies /api → :3000)
npm test           # node:test via tsx — no jest
npm run build      # tsc + vite build → dist/
npm start          # node dist/main.js (serves API + WebUI)
docker compose up --build   # production-style run, data in named volume
```

## Conventions

- Files kebab-case; one class per concern; no `I` prefix on interfaces (e.g. `GameCodeRepository`).
- i18n: flat key JSON per language in `webui/src/i18n/`. New language = one JSON + one `LANGS` entry.
- Scrapers are lenient (skip invalid entries, count them), redeemers are strict.
- `ponytail:` comment marks a deliberate shortcut + its upgrade path. Keep them; don't silently expand code.
- Courtesy delay (`REDEEM_DELAY_MS`) between redemptions of the same game — do not remove.
- Never automate around captchas; NEEDS_MANUAL + official-site deep link is the designed fallback.

## Pitfalls learned here (do not re-learn them)

- `npm install` blocks postinstall by default (`allowScripts` in package.json — esbuild is whitelisted).
- Nest DI tokens live in `src/infrastructure/di-tokens.ts`; controllers inject tokens, not classes,
  except for use cases which are framework-free classes.
- `GameCode` identity is `"<gameId>:<CODE>"` via `CodeKey.toString()` — repositories key on that.
- The WebUI polls every 20 s (`usePolling` runs immediately then intervals); don't add websockets.

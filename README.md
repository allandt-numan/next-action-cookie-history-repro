# router.push after a revalidating Server Action replaces history (Next 16)

Repro for https://github.com/vercel/next.js/discussions/98822

On Next 16.2.10, calling `router.push()` after awaiting a Server Action whose response has
`X-Action-Revalidated` commits a `replaceState` instead of a `pushState`. Pressing Back skips the
page the action ran on. The same app on Next 15.5.18 pushes correctly.

A Server Action is flagged as revalidating when it sets a cookie. It's also flagged when **middleware** sets a
cookie on the action request, even if the action itself is read-only. That means a middleware
that refreshes a session or analytics cookie on every request triggers this on every action.

## Run it

```bash
npm install
npx playwright install chromium   # first time only
npm run build

npm start                          # middleware sets a cookie on every request
npm run test:history               # read-only action -> Back skips /a

SKIP_ACTIONS=1 npm start           # middleware skips requests with a next-action header
npm run test:history               # read-only action -> Back lands on /a
BUTTON=cookie npm run test:history # action sets its own cookie -> Back skips /a
```

The journey is `/` → `/a` (client nav) → click Continue (`await action()`, then
`router.push('/b')`) → Back. `/b` is prefetched by a visible `<Link>` before the click.

## Results

`next build` + `next start` on localhost, Chromium via Playwright, 3 runs each on 16.2.10 and 2 on
15.5.18. The results were the same on every run.

| Next | Scenario | `X-Action-Revalidated` | Navigate events after /a | Back lands on |
| --- | --- | --- | --- | --- |
| 16.2.10 | Middleware sets cookie, read-only action | `1` | `replace → /b` | `/` ❌ |
| 16.2.10 | Middleware skips actions, read-only action | absent | `push → /b` | `/a` ✅ |
| 16.2.10 | Middleware skips actions, action sets cookie | `1` | `replace → /b` | `/` ❌ |
| 15.5.18 | Middleware sets cookie, read-only action | `[[],0,1]` | `push → /b` | `/a` ✅ |
| 15.5.18 | Middleware skips actions, action sets cookie | `[[],0,1]` | `push → /b` | `/a` ✅ |

No proxy or CDN is involved, and nothing in `next.config.ts`.

## Relevant source (16.2.10)

- `server/async-storage/request-store.js`: `mergeMiddlewareCookies` copies middleware cookies
  into `mutableCookies` with `.set()`, which marks them as modified.
- `server/app-render/action-handler.js`: `getModifiedCookieValues(requestStore.mutableCookies)`
  then sets `X-Action-Revalidated`.
- `client/components/router-reducer/reducers/server-action-reducer.js`: on that header, the client
  invalidates the prefetch cache and navigates to the current URL with `RefreshAll`.
- `client/components/app-router.js` (`HistoryUpdater`): the following `router.push` ends up
  committed with `replaceState`.

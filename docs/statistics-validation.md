# Statistics validation

The recommendation cards, desktop grid, action placement and filters retain their existing styles. Recommendation navigation now classifies supported markets separately from their evaluation. Statistical counts accept nonnegative integers (including zero); missing/invalid statistics are excluded from denominators. A group with no evaluable records displays `Sin datos`.

`1` and `2` identify the upcoming match's home and away teams. In each team's historical group, the outcome is mapped to that team's identity: for example, selection `1` counts wins by the upcoming home team in its group and losses by the upcoming away team in its group, irrespective of historical venue. Head-to-head history counts the selected team's outcome. Team totals also follow identity instead of the historical home/away column. Corner winners compare both teams instead of applying a total line.

The backend's `app/controllers/eventosLiga.js#getCriterio` and `app/models/eventosLigaProb.js`, inspected at `d64c9b169eae3364b0b43f1c70757546f4c3ad9c`, expose final goals and full-match corner/card/shot counts, without half scores. Period recommendations therefore show an unavailable-data notice and do not apply their selections or lines to full-match data. General full-match analysis remains separately labelled. No period score is inferred.

## Reproduce

Use Node 24 and npm 10:

```sh
npx --cache /tmp/bettics-npm-cache --yes npm@10 ci --legacy-peer-deps --cache /tmp/bettics-npm-cache --no-audit --no-fund
NG_BUILD_MAX_WORKERS=4 npm run build -- --output-path=dist-vercel
```

The production build can emit the existing CommonJS and stylesheet-budget warnings. Keep generated files in ignored `dist-vercel`, because `dist` is tracked.

Focused tests (85 Jasmine tests, including Angular template and simulated-service navigation):

```sh
CHROME_BIN=/usr/bin/chromium NG_BUILD_MAX_WORKERS=4 npm test -- --watch=false --browsers=ChromeHeadless --ts-config=tsconfig.statistics-spec.json --include='src/app/shared/utils/*.spec.ts' --include='src/app/main/account/pages/event-liga-page/*.spec.ts'
```

If Chromium cannot use its sandbox in the container, set `CHROME_BIN` to a temporary executable wrapper running `/usr/bin/chromium --no-sandbox "$@"`. The focused TypeScript configuration deliberately excludes the existing `app.component.spec.ts` failure: it refers to nonexistent `AppComponent.title` (TS2339). The normal suite still fails compilation for that reason; its assertions were not changed or marked passed.

Browser smoke tests require Playwright outside application dependencies. For example, install it into a temporary prefix, then run the development server with the production API configuration:

```sh
npm install --prefix /tmp/bettics-browser-tools --cache /tmp/bettics-npm-cache --no-save playwright
CI=true NG_BUILD_MAX_WORKERS=4 npm run serve -- --configuration=production
# In another shell:
PLAYWRIGHT_MODULE=/tmp/bettics-browser-tools/node_modules/playwright node scripts/statistics-browser-smoke.cjs
```

The script uses system Chromium and verifies actual recommendation-link navigation for eleven selections, active tabs, exact corner lines, 1X2 team identity, both-scoring Yes/No, both unavailable periods, corner comparison, three desktop columns, right-side actions and the help popup. Every backend response is simulated and the user session is synthetic. This validates the frontend, not backend data or real authentication. `STATISTICS_BASE_URL` can target an accessible deployment for the same frontend-only smoke test. Without it, requests stay local; the screenshot is saved under `/tmp`.

## External limits

An unauthenticated request to the real historical API returns HTTP 401, so authenticated real-data statistics require a user session. Preview deployments can redirect to Vercel authentication. Validate the GitHub/Vercel deployment state separately from application responses and clearly report any inaccessible checks. Publishing the Codex environment draft is independent of deploying the website.

Season regression coverage accepts annual string/number API values and slash/hyphen seasons, compares full season identifiers, and clears teams before a league change. These tests use simulated services; they do not establish that the production Peru dataset exists or that recommendation league/team identifiers match it.

The supplied Sport Huancayo–Alianza Atletico URL is covered without team IDs: lookup tolerates accents/case/whitespace, resolves the historical IDs, and keeps the exact league identifier. Home/away selectors share the league team list so a team is available even if it only played in the opposite historical venue. Unknown or ambiguous names show a selection notice instead of silently suppressing the historical request. The reproduction uses a simulated Alianza Atlético record; production API data still requires authentication.

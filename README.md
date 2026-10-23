# Auto Shop Menu (public site)

The customer-facing Auto Shop price menu as a static site, for Cloudflare Pages.

- **Prices are edited in the autoshop dashboard** (Price Menu page).
- When a customer opens a page, `menu.js` loads the latest values from the dashboard's public API (`<MENU_API_URL>/api/public/menu?page=…`) and puts them into the page. Changes appear on the next page load.
- If the API doesn't answer within 4 seconds, or the dashboard is down, the page keeps the prices built into the HTML: the October 2026 list from `source/`. The Custom POS calculator then runs on that built-in data too.
- No database access and no secrets: the site only reads a public API.

## Files
| Path | What it is |
|---|---|
| `source/` | The menu exactly as delivered by OTAS (HTML, `site.css`, `custom.js`, `custom-data.js`, `img/`). Don't edit by hand; replace it when a new design arrives. |
| `scripts/build.mjs` | Copies `source/` to `out/`, marks every price/date/contact with `data-m` attributes, and adds `menu.js` + `menu-config.js` (the API address) |
| `src/menu.js` | Loads the values in the browser and fills the marked elements; starts the calculator |

## Cloudflare Pages settings
| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `out` |
| Environment variable | `MENU_API_URL` = the dashboard's address, e.g. `https://dashboard.example.com` (no trailing slash) |

The API address is written into the site when it's built, so redeploy after changing `MENU_API_URL`. Price changes don't need a redeploy.

## Local preview
```bash
MENU_API_URL=http://localhost:3000 npm run build
```
Then serve `out/` with any static server (for example `npx serve out`) while the dashboard runs on port 3000.

## Updating the design
When OTAS sends new menu files:
1. Replace `source/` with the new `site/` folder.
2. Run `npm run build`. It fails with a clear message if a price it marks has moved or changed, so update `PAGE_MARKS` in `scripts/build.mjs` to match.
3. The dashboard must be updated in the same way (its templates, defaults and placeholder names), because `data-m` keys must match the values its API returns.

Content (prices, features, wording) is approved by Thant Sin Oo (OTAS). Don't change it without his confirmation.

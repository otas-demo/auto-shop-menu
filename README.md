# Auto Shop Menu (public site)

The customer-facing Auto Shop price menu, served on its own domain.

- **Prices are edited in the autoshop dashboard** (Price Menu page). This site only reads them.
- It reads the same MongoDB document as the dashboard (`menusettings`, key `main`). Until something has been saved there, it shows the built-in October 2026 price list.
- Pages are rendered on the server from the original menu HTML (`src/lib/menu/templates.ts`) with prices filled in on every request, so a save in the dashboard shows up immediately.

| URL | Page |
|---|---|
| `/` | Menu home |
| `/commercial`, `/enterprise` | POS packages |
| `/custom` | Custom POS calculator |
| `/hardware` | Hardware |
| `/ai-facebook`, `/ai-viber`, `/ai-telegram` | AI order channels |

## Setup
1. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.
   - Point it at the **same database** as the dashboard.
   - Use a MongoDB user with **read-only** access (in Atlas: Database Access → role `read` on that database). This site never writes.
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Deploy
- Any Node.js host that runs Next.js (Vercel, a VPS with `npm run build && npm start`, …).
- Set `MONGODB_URI` in the host's environment settings.
- If you use MongoDB Atlas, allow the host's IP address under Network Access.
- Point your customer domain at this deployment.

## When the database is unreachable
- If the server has already loaded the menu, customers keep seeing the last loaded prices (after about 4 seconds).
- Otherwise they see a short "temporarily unavailable" page (after about 10 seconds).
- Built-in prices are never shown as a fallback, so customers can't see outdated numbers.

## Updating the design
When OTAS sends new menu files (an `auto-shop-menu` folder with `site/`):
```bash
node scripts/generateMenuTemplates.mjs "<path to auto-shop-menu>"
```
This regenerates `src/lib/menu/templates.ts` and copies `site.css`, `custom.js` and the images into `public/menu-assets/`.

**Keep the dashboard in step.** The dashboard (`autoshop-dashboard`) has the same menu code: it serves `/menu` and validates what the editor saves. When the design or the data shape changes, update both repos together:
- run the dashboard's own copy of the generator too (it writes `/menu/...` links; this one writes root links);
- keep `src/lib/menu/` (types, defaults, render, migrate, format) the same in both, except for the links in `render.ts`.

Content (prices, features, wording) is approved by Thant Sin Oo (OTAS). Don't change it without his confirmation.

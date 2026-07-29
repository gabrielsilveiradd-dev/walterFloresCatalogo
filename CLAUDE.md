# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Catalog + checkout for **Walter & Flores**, a flower shop in Nilópolis/RJ. Deployed on Vercel.

No build system, no package manager, no dependencies. The entire site is a single
`index.html` (~2,680 lines: markup, CSS in one `<style>`, JS in one `<script>`), plus
two serverless functions under `api/`.

There is **no database**. Order state lives in the customer's `localStorage`.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole site — markup, styles, product data, and all client logic |
| `api/criar-pagamento.js` | Creates the Mercado Pago preference (Pix / card / boleto) |
| `api/status-pagamento.js` | Asks Mercado Pago whether a given order was paid |
| `vercel.json` | `cleanUrls: true`, `trailingSlash: false` |
| `images/` | Product photos used by the catalog (79 files) |
| `uploads/` | AI-generated flower images, not referenced by the catalog (50 files) |

## Editing this project

Everything is inside `index.html`. There is nothing to compile — open the file in a
browser and it works, except the `/api/*` calls, which need Vercel (`vercel dev`) or a
stub server.

## Environment variable

`MP_ACCESS_TOKEN` — the shop's Mercado Pago production access token, set in Vercel
under Settings → Environment Variables. **Never put it in the client code.** Both API
routes return a 500 with a clear message when it is missing.

## Purchase flow (the important part)

Deliberately **no webhook and no database**. A Mercado Pago webhook is a server-to-server
call; with no database there is nowhere to record "order X was paid" for the customer's
browser to read. Instead the page *asks*:

1. Customer clicks **Comprar agora** on a card (or in the bouquet builder) → modal opens.
2. Customer fills region, address, name, and an optional card message → clicks
   **Pagar com Mercado Pago**.
3. The client mints an order number (`WF-20260728-A7K3`), saves the order to
   `localStorage`, and `POST`s to `/api/criar-pagamento` with it as `ref`.
   The modal switches to a 3-step view:
   - **Step 1** — a WhatsApp button carrying the *PEDIDO REGISTRADO — AGUARDANDO PAGAMENTO*
     message. This is what alerts the shop; it states explicitly that payment has not
     happened yet.
   - **Step 2** — the Mercado Pago link (`init_point`), opened in a new tab.
   - **Step 3** — a spinner, replaced automatically by the *envie o comprovante* WhatsApp
     button once payment clears.
4. While step 3 waits, the page polls `/api/status-pagamento?ref=…` every 5s. That route
   hits `GET /v1/payments/search?external_reference=…` with the shop's token and reports
   the real status. Polling stops on approval, or gives up after 20 minutes and offers a
   manual WhatsApp fallback.
5. If the customer closes the tab and pays the Pix later from their bank app, the order is
   still in `localStorage`: on their next visit a **"Retomar pedido"** bar appears and
   polling resumes. Returning via Mercado Pago's `back_urls` (`?pedido=…&status=ok`) opens
   the modal straight into step 3 and strips the query string via `history.replaceState`.

The WhatsApp integration is **link-only** (`wa.me/<PHONE>?text=…`) — there is no WhatsApp
Business API. Every message is composed client-side and the customer presses send.

### Key constants (all in `index.html`)

| Constant | Meaning |
|---|---|
| `PHONE` | Shop WhatsApp number, `5521964527031` |
| `WRAP_PRICE` | Wrapping + ribbon for a custom bouquet, `35` |
| `MP_ENDPOINT` / `STATUS_ENDPOINT` | The two API routes |
| `LS_PEDIDO` | `localStorage` key holding the pending order |
| `POLL_MS` / `POLL_LIMITE` / `PEDIDO_TTL` | 5s poll, 20min give-up, 24h order expiry |
| `FRETE` | 11 delivery tiers, R$ 0 (store pickup) to R$ 60 (Duque de Caxias) |

`coletarEntrega()` validates the form and returns the delivery object;
`montarWhats()` builds the shared order body that both WhatsApp messages wrap.

## Product data

`PRODUCTS` — 69 objects rendered into `#grid`, with client-side category filters:

```js
{ "code":"MV · 001", "img":"images/mv001.jpg", "alt":"Singela Gérbera",
  "ribbon":"Mais Vendido", "meta":"N. I · Mais Vendido",
  "n1":"Singela", "n2":"Gérbera",      // n2 renders italic
  "desc":"…", "preco":2, "cat":"mv" }
```

Categories (`CATS`): `mv` Mais Vendidos (7), `buque` Buquês (42), `orquidea` Orquídeas (5),
`arranjo` Arranjos (2), `cesta` Cestas do Coração (12), `complemento` Complementos (1).

`SPECIES` — 11 flower species for the "Monte seu buquê" builder, each with colour variants
carrying their own `price` and `img`.

Product text goes through `H()` before being injected — keep using it when touching the
render path.

## Design system

```css
--terra:#A23C1E   --terra-2:#8F3216   --terra-deep:#6E240E   --terra-ink:#4A1607
--peach:#F9E8D9   --peach-2:#FCF1E6   --cream:#FFF9F2
--orange:#DE6E22  --orange-soft:#EE8A3C
--ink:#3E2A1E     --ink-soft:#7A5F4E
--green:#41522F   --green-deep:#31401f
--line:rgba(162,60,30,.16)   --line-strong:rgba(162,60,30,.28)
--r-lg:22px --r-md:16px --r-sm:12px
--serif:'Fraunces'  --sans:'Jost'
```

Two Google Fonts: **Fraunces** (headings, prices, product names) and **Jost** (body, labels).
Uppercase tracked labels use `.caps` / `.m-label`.

Icons come from an inline SVG sprite of 16 symbols, referenced via `<use href="#i-…"/>`:
`i-flower`, `i-arrow`, `i-truck`, `i-leaf`, `i-heart`, `i-whats`, `i-bag`, `i-clock`,
`i-close`, `i-phone`, `i-cake`, `i-star`, `i-gift`, `i-tulip`, `i-sun`, `i-sprig`.

Modal form classes are prefixed `.m-` (`.m-input`, `.m-label`, `.m-totals`, `.m-pay`, `.m-wa`);
the 3-step payment view is prefixed `.fx-` (`.fx-step`, `.fx-n`, `.fx-wait`, `.fx-ok`).
A completed step gets `.done` (faded, green number).

## Page structure

`header.site` → `.hero` → `.badges` → `#colecoes` → `#historia` → `#ocasioes` → `.ctabar`
→ `#catalogo` (filters + `#grid`) → `#monte` (bouquet builder) → `#modalBg` (purchase modal)
→ `#retomarBar` (pending-order bar) → `footer#contato`

Sections animate in with an `IntersectionObserver` on `.reveal`.

## Testing the checkout locally

The API routes need `MP_ACCESS_TOKEN`. To exercise the UI without real credentials, serve
the folder with a stub that answers `/api/criar-pagamento` with a fake `init_point` and
`/api/status-pagamento` with `pago:false` a few times, then `pago:true` — that verifies the
step transitions, the automatic confirmation, and the "Retomar pedido" bar.

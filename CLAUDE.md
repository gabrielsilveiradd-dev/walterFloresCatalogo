# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static HTML product catalog for **Walter & Flores** — a floriculture shop in Nilópolis, RJ. The catalog is themed for Valentine's Day (*Dia dos Namorados*) and is entirely self-contained in HTML files with no build system.

## Files

| File | Purpose |
|------|---------|
| `Catalogo Walter Flores.html` | Primary web catalog — open directly in browser |
| `Catalogo Walter Flores-print.html` | Print-optimized variant (A4 landscape, 6 cards/page) |
| `Catalogo Walter Flores - Standalone.html` | Bundled self-contained version; loads images as base64 blobs at runtime via `DecompressionStream` |

No build step. Open HTML files directly in the browser.

## Architecture

All CSS lives in `<style>` blocks within each HTML file — there are no external stylesheets. The three HTML files share nearly identical CSS; changes to visual design must be applied to each file separately.

### Design Tokens (CSS custom properties)
```css
--green-900 / -800 / -700 / -600 / -500  /* dark forest backgrounds */
--bordeaux-900 / -800 / -700              /* wine/accent color */
--cream / --cream-2 / --paper             /* off-white backgrounds */
--gold / --gold-soft                      /* #b8935a / #c9a86b */
--ink                                     /* body text: #1a1410 */
--rule                                    /* rgba gold, for dividing lines */
```

### Typography
Three Google Fonts loaded via CDN:
- `Italiana` — brand name, section headings, decorative numerals
- `Cormorant Garamond` — body serif text, card descriptions, prices
- `Inter` — UI labels, smallcaps, buttons

CSS utility classes: `.serif`, `.italiana`, `.smallcaps`

### Page Sections (in order)
1. `.cover` — full-viewport hero with botanical SVG corner sprigs
2. `.section-head` — dark green divider with collection title
3. `.catalog` — product grid (3 columns on desktop, 2 on tablet, 1 on mobile)
4. `.quote` — bordeaux interstitial with blockquote
5. `footer` — dark footer with 4-column grid

### Product Cards
Each `<article class="card">` contains:
- `.card-img` — square image with `.ribbon` badge and `.code` (e.g. `WF · 001`)
- `.card-meta` — Roman numeral + category label
- `<h4>` — product name with `<em>` for italicized secondary word
- `.desc` — description with `contenteditable="true"` (editable directly in browser)
- `.card-footer` — price display + "Encomendar" button

### Print Version Specifics
`-print.html` uses `@media print` overrides:
- Pages sized at 297mm × 210mm (A4 landscape)
- `.card:nth-child(6n)` triggers `break-after: page` for 6-cards-per-page pagination
- Hover transitions and `contenteditable` outlines are suppressed

### Images
- `images/` — product photos (JPG)
- `uploads/` — AI-generated images (PNG, from Gemini)

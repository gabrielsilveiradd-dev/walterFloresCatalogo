# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static HTML catalog for **Walter & Flores**, a flower shop in Nilópolis/RJ. No build system, no dependencies, no package manager — everything is vanilla HTML, CSS, and JavaScript.

## Files

| File | Purpose |
|---|---|
| `Catalogo Walter Flores.html` | Main working file — the editable catalog |
| `Catalogo Walter Flores-print.html` | Print-optimized version |
| `Catalogo Walter Flores - Standalone.html` | Self-contained bundle (assets inlined as base64) — do not edit directly |

All changes should be made to **`Catalogo Walter Flores.html`**. The standalone file is a generated artifact.

## Design system (CSS variables)

```css
--green-900: #081b12   /* darkest background */
--green-800: #0e2a1c   /* section headers, card text */
--green-700: #163826
--bordeaux-800: #5a0f1f  /* accents, prices, ribbons */
--bordeaux-700: #7a1730
--cream: #f3ead7       /* main background */
--paper: #f7f0dd       /* card background */
--gold: #b8935a        /* borders, ornaments */
--gold-soft: #c9a86b   /* labels, secondary gold */
--rule: rgba(184,147,90,.45)  /* divider lines */
```

## Typography

Three Google Fonts families used throughout:
- `'Italiana', serif` — brand name, large headings, ornamental numbers
- `'Cormorant Garamond', serif` — body text, descriptions, prices, quotes
- `'Inter', sans-serif` — small caps labels, utility text

Utility classes: `.serif`, `.italiana`, `.smallcaps`

## Page structure (sections in order)

1. `.cover` — full-viewport hero with botanical SVG corners and brand identity
2. `.section-head` — dark green header introducing the collection
3. `.catalog` → `.grid` → `.card` × 35 — the product grid
4. `.quote` — bordeaux interstitial with editorial quote
5. `footer` — contact info, address, hours

## Card anatomy

Each `.card` article contains:
- `.card-img` — 1:1 aspect ratio image + `.ribbon` badge + `.code` (WF · 00N)
- `.card-meta` — roman numeral + category label
- `h4` — product name (regular + `em` italic part)
- `.desc` — description, marked `contenteditable="true"` (editable in-browser)
- `.card-footer` → `.btn` — "Encomendar" CTA

## Image assets

- `images/` — product photos (buquês, orquídeas) used by the main catalog
- `uploads/` — AI-generated flower images (Gemini), not currently displayed in the catalog

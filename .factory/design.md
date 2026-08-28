# Visual thesis — guarded handoff, printed twice

## Direction and rationale

SQLite Sync Guard uses a **risograph tactile collage**: misregistered ink,
cut-paper geometry, and halftone fields turn an invisible filesystem race into
something physical. A database is a dark teal canister; live WAL pages are
vermilion slips escaping a sync folder; the safe export is a neatly tied paper
parcel. The slightly imperfect print language fits a tool about exact copies:
the visual tension makes “file copy is not database replication” memorable.

The landing page is explicitly light-mode, like a cream stock instruction
sheet. This is intentional rather than an omitted theme: paper texture and
overprinted inks are the product identity, while all task content keeps strong
contrast on the painted background.

## Color tokens

| Token | Value | Use |
| --- | --- | --- |
| paper | `#F3E9D5` | page background |
| clean paper | `#FFF9EC` | code and raised surfaces |
| registration ink | `#182922` | primary text and outlines |
| quiet ink | `#53645D` | secondary text (≥ 4.5:1 on paper) |
| bottle teal | `#0B5B53` | primary action, safe state |
| dried vermilion | `#982F29` | danger and live-sidecar warning |
| ochre | `#A96508` | caution and print accents |
| pale teal | `#C7DDD2` | safe-state wash |
| pale red | `#E8C2B8` | unsafe-state wash |

Body text is registration ink; muted ink is used only at 16px or larger.
White-on-teal and white-on-vermilion pass 4.5:1. Ochre is never used for body
text or as the only carrier of meaning.

## Typography

- **Display:** Georgia, Times New Roman, serif. The broad, editorial shapes
  feel like letterpress headings and make the warning read like a field manual.
- **Utility:** ui-monospace, SFMono-Regular, Consolas, monospace. Commands,
  labels, navigation, and body copy share the precise rhythm of terminal output.

Both are system stacks: no font files, CDN requests, or rendering delay. The
scale is 14 / 16 / 20 / 32 / clamp(48–80) px with 1.5 body leading and a
maximum reading measure of 68 characters.

## Spacing and composition

An 8px base rhythm drives 8, 16, 24, 32, 48, 64, and 96px spaces. Sections use
generous paper margins; dense command examples use 16–24px. Borders are 2px
registration-ink strokes with hard 6px offset shadows, evoking misaligned
plates without sacrificing legibility. On 390px screens the collage stacks
after the core warning, proof steps become one column, and secondary decorative
print scraps disappear.

## Interaction grammar

Controls behave like pieces of paper being pressed: hover shifts up 2px, active
returns to the sheet, and focus gets a 3px ochre ring plus 2px paper gap. Copy
buttons announce success in a polite live region. The recorded terminal demo
switches between safe and unsafe fixtures without filesystem or network access;
the state label and explanation always accompany color.

## Motion policy

One 420ms reveal settles print layers into registration on first view. UI state
changes use 180ms opacity/transform transitions; no animation loops. Under
`prefers-reduced-motion: reduce`, all transforms, smooth scrolling, and timed
reveals are removed; state changes remain immediate and fully visible.

## Asset plan and provenance

- `site/public/guarded-handoff.webp` and its 600px responsive derivative:
  original generated hero illustration,
  created for this product with the factory image deployment, then locally
  converted to WebP under 300 KB. Prompt: “Editorial risograph collage on warm
  cream paper; open sync folder as a cut-paper tray, dark teal SQLite database
  cylinder, loose vermilion WAL/SHM sheets caught by a bold mechanical guard,
  one clean tied export parcel leaving safely; two-ink teal/vermilion with ochre
  overprint, coarse halftone, fibrous paper, slight misregistration, wide
  landscape, no letters, no logos, no watermark.” License: original project
  asset, generated 2026-08-27; no third-party source material.
- Small arrows, lock marks, and terminal ornaments are hand-built in CSS from
  lines and rectangles. They are decorative and do not replace semantic text.
- `site/public/social-card.png` and `site/public/apple-touch-icon.png` are
  project-owned crops derived locally from `guarded-handoff.webp` with
  ImageMagick; no new source material or third-party asset was introduced.

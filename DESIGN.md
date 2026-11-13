# Design rules

The house rules for every web page and web app built on web-shared. They come from what the
existing pages keep doing and from the mistakes that had to be fixed in them, one by one. A rule
marked **[check: name]** is enforced by `tools/check-page.mjs`; a page is not done until it passes:

    node tools/check-page.mjs URL|FILE ...            # or: project-lifecycle page-check URL|FILE ...

It loads the page at 375 and 1280 px, in light and in dark, and exits 1 on any finding. Read the
renders too (`--shots DIR`): the check catches what can be measured, not whether the page is
good.

## 1. Nothing moves unless the user moved it

- **A state changes colour, never size.** `:hover`, `:focus`, `:active`, selected, open and current
  may change `color`, `background`, `border-color`, `outline`, `box-shadow`, `opacity` or a
  `transform` of the element itself. Never `border` (the shorthand sets the width), `border-width`,
  `padding`, `margin`, `font-size`, `font-weight` or `letter-spacing`. An element drawn without a
  border keeps a transparent one of the same width, so a state can colour it in. **[check: moves]**
- **The current tab or item is marked by colour,** not by bold: a weight change widens the label
  and shifts its neighbours.
- **What appears floats.** A tooltip, menu or popover is positioned absolutely and never pushes the
  layout; space for something that appears in flow (a count, an error line) is reserved.
- **No layout shift from loading:** images carry `width` and `height` (or an `aspect-ratio`), fonts
  are local, and the scrollbar gutter is stable (`scrollbar-gutter: stable` on long pages).
- **The page never reloads or re-renders under the reader.** Scroll position and open folds survive
  any automatic update.
- **A view that changes (another day, another tab, a selection) keeps every control where it was.**
  Fixed widths for tabs and toggles; numbers in `tabular-nums`.

## 2. Everything fits

- **Nothing scrolls sideways at 375 px** except a table or a scroller made for it, and the page
  itself never does. Long words and URLs break (`overflow-wrap: anywhere` on cards and cells); grid
  children get `min-width: 0`. **[check: overflow]**
- **Text is never cut off silently.** A box that hides overflow shows an ellipsis or a line clamp; a
  placeholder fits its field at the narrowest width, or is shortened. **[check: clipped]**
- **Wide content wraps into a grid of cards on a phone**, not a horizontal scroller, unless the
  user asked for one. Tab bars are the exception: one row that scrolls.
- **A sidebar or panel is never taller than the viewport** without scrolling on its own.
- **Short labels in a row stay on one line;** a row built to wrap (chips, actions) wraps whole items.

## 3. Hierarchy is set by type

- **Each heading level renders smaller than the one above it,** h1 > h2 > h3, on every page and
  width. App pages set the scale themselves (h1 about 2rem/600, h2 1.15rem/600); document pages keep
  the house scale (light h1 and h2, 300 weight). **[check: headings]**
- **One page title.** The title row holds the h1 and at most one primary action beside it.
- **Secondary text is `--cdark`, never `opacity`.** `--cdark` is measured for contrast in both
  themes; opacity on text lowers it below AA. **[check: contrast]**
- **Numbers are `tabular-nums`,** right-aligned in tables; dates read as "2 Mar 2025", money as
  "₺18,999" (sign and grouping), relative time where it helps ("in 18 days").
- **Sentence case** everywhere: headings, buttons, labels. No uppercase headings; small caps only
  for tiny labels (a countdown unit).
- `text-wrap: balance` on headings; paragraphs stay within about 70 characters.

## 4. Colour

- **Light and dark both, from `prefers-color-scheme` only,** through the palette tokens (`--cfg`,
  `--cbg`, `--cdark`, `--clight`, `--cmed`, `--cfield`, `--clink`, `--cemph`, `--cemphbg`, and
  `--ws-good`, `--ws-bad` for status). No hex literal outside a palette block, whose ratios are
  measured and written beside each value.
- **Text meets WCAG AA in both themes:** 4.5:1, or 3:1 at 24 px and above (18.66 px bold).
  **[check: contrast]**
- **One accent.** `--clink` for links and focus, `--cemph` for the primary or current item, the
  status pair for good and bad. Danger is `--ws-bad`, never a literal red.
- A coloured tile or chip sets its colour per theme: a light text colour on a dark tint does not
  survive the light theme.

## 5. Controls

- **Every control is at least 24 x 24 px at a phone width** (2.6rem tall for form controls and
  buttons the thumb aims at). **[check: targets]**
- **Focus is always visible:** a field changes its border colour and glows; `summary`, `select` and
  custom controls get an outline. Never `outline: none` without a replacement.
- **Inputs are at least 16 px** so iOS does not zoom into them.
- **The way to act is never hidden.** Secondary actions may appear on hover only under
  `@media (hover: hover)`; on touch they are always shown.
- **Buttons in a group share one height and one baseline;** a destructive action sits apart from the
  others, quiet until hovered, and never next to the primary one without a gap.
- **Hover styles live once, in the stylesheet that owns the control,** never per page: a fix made
  for one checkbox is a fix for every checkbox.

## 6. Layout

- **Widths:** documents 50rem (66rem with the contents column), single-column apps 56rem, dense
  tools up to 90rem. Content never touches the viewport edge (at least 0.75rem at 375 px).
- **Breakpoints:** 480px for phone controls (stack pairs, scroll the tab row), 40rem for layout
  changes, 55rem only for the contents column.
- **Document pages** get the sticky contents column (`page-new`). **App pages** get a top bar of tabs
  that scrolls sideways on a phone; the brand and the user hide there.
- **Cards** use a tint of the text colour (5-9%) or a 1px rule, not both, with a 10px radius;
  inner elements get a smaller radius than their container.
- **Aligned to one grid:** icons centred on their text, wrapped lines hang under the first line's
  text, not under its icon, and columns of numbers line up on the right.

## 7. Content states

- **Every list has an empty state** that says what goes there and how to add the first one, in one
  sentence, with at most one action.
- **Errors say what is wrong and what to do,** inline beside the field; never `alert()`.
- **Forms ask for the minimum** ("Only the name is needed"); the rest folds away under a `details`
  whose summary names what is inside.
- **Show, don't make the reader edit:** a record is read as a sentence ("₺18,999 at Shop · 2 Mar
  2025") with the edit form folded behind it.

## 8. Motion

- Transitions on colour and transform only, under 200 ms, none on layout properties.
- `prefers-reduced-motion: reduce` turns motion off.

## 9. Checking a page

1. `check-page` at both widths: no findings, or each one fixed or marked `data-check-skip` with a
   reason in a comment beside it.
2. Read the renders (`--shots`): density (is anything crammed?), alignment across a row, and the
   page against the request, line by line.
3. A page served by an app is checked from its server; a page opened from disk is checked as a
   file, the way the reader opens it.

What the check cannot measure stays a reading job: whether the layout is crowded, whether the
hierarchy matches what matters, and whether it does what was asked.

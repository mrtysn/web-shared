# Design rules

The house rules for every web page and web app built on web-shared. They come from what the
existing pages keep doing and from the mistakes that had to be fixed in them, one by one. A rule
marked **[check: name]** is enforced by `tools/check-page.mjs`; a page is not done until it passes:

    node tools/check-page.mjs URL|FILE ...            # or: project-lifecycle page-check URL|FILE ...

It loads the page at 375 and 1280 px, in light and in dark, and exits 1 on any finding. Read the
renders too (`--shots DIR`): the check catches what can be measured, not whether the page is
good.

A site whose owner departs from a rule here on purpose writes the departure in its own
`CLAUDE.md`, with the reason and the date, and in a comment at the code that departs. Unwritten,
each new session reads the departure as a bug and fixes it back.

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
  are local, and the scrollbar gutter is reserved on every page, on both edges
  (`scrollbar-gutter: stable both-edges`), so content neither jumps between a short page and a
  long one nor sits off centre.
- **The first frame is drawn in the house font.** Preload the weight the first visible text uses.
  Where a browser still paints a fallback first (Firefox applies even a preloaded font one frame
  late), hold the first render on that font's load with a hard ceiling of about 100 ms.
- **State kept across a refresh is restored before the first paint,** never drawn at its default
  and then moved. It is scoped to the tab, expires after a short window, and falls back to the
  default.
- **The page never reloads or re-renders under the reader.** Scroll position and open folds survive
  any automatic update.
- **A view that changes (another day, another tab, a selection) keeps every control where it was.**
  Fixed widths for tabs and toggles; numbers in `tabular-nums`.

## 2. Everything fits

- **Nothing scrolls sideways at 375 px** except a table or a scroller made for it, and the page
  itself never does. Long words and URLs break (`overflow-wrap: anywhere` on cards and cells); grid
  children get `min-width: 0`. **[check: overflow]**
- **A code block wraps; it never scrolls sideways.** A drafted message sits in one long line, and a
  line cut off at the block's edge cannot be read or checked. `pre > code` is `white-space:
  pre-wrap`.
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
- **One typeface.** Names and headings are set in the body face and told apart by size, case and
  colour. A second face added for character is tried first on the real words it will set: a
  monospace face gives a narrow letter a full slot and opens gaps inside a name.
- **Secondary text is `--cdark`, never `opacity`.** `--cdark` is measured for contrast in both
  themes; opacity on text lowers it below AA. It is for metadata (labels, years, captions); text
  that wraps into lines stays at `--cfg`. **[check: contrast]**
- **Numbers are `tabular-nums`,** right-aligned in tables; dates read as "2 Mar 2025", money as
  "₺18,999" (sign and grouping), relative time where it helps ("in 18 days").
- **Sentence case** everywhere: headings, buttons, labels. No uppercase headings; small caps only
  for tiny labels (a countdown unit). A site whose identity is lowercase sets it with
  `text-transform` on the elements that carry it and keeps the source text correctly cased.
- **A favicon is the wordmark,** made by a script from the site's own font and accent that writes
  every format (SVG that follows the theme, ICO, touch icon), one weight heavier than the text,
  since it is read at 16 px.
- `text-wrap: balance` on headings; paragraphs stay within about 70 characters.

## 4. Colour

- **Light and dark both, from `prefers-color-scheme` only,** through the palette tokens (`--cfg`,
  `--cbg`, `--cdark`, `--clight`, `--chover`, `--cmed`, `--cfield`, `--clink`, `--cemph`, `--cemphbg`, and
  `--ws-good`, `--ws-bad` for status). No hex literal outside a palette block, whose ratios are
  measured and written beside each value. A shade between two tokens is mixed from them
  (`color-mix(in oklab, var(--cfg) 70%, var(--cbg))`, or a token with `transparent`), so it
  follows both themes.
- **Text meets WCAG AA in both themes:** 4.5:1, or 3:1 at 24 px and above (18.66 px bold).
  **[check: contrast]**
- **A hover or selected background is `--chover`, never `--clight`.** `--chover` is the text
  colour at 10% over the page, so it steps the same distance from the page in every palette and
  both themes; `--clight` is a surface and in light themes sits as light as the page.
  **[check: tints]**
- **One accent.** `--clink` for links and focus, `--cemph` for the primary or current item, the
  status pair for good and bad. Danger is `--ws-bad`, never a literal red. A site gives `--cemph`
  a short, fixed list of meanings (who the page is about, what is current) and writes that list
  down, so the accent stays a signal. `--clink` and `--cemph` are visibly different hues in both
  themes; check their distance whenever either changes.
- **A page drawn for one theme says so** with `<html data-theme-fixed="light">` (or `"dark"`); never
  paint a light background over the dark tokens, which leaves their light text on it.
- A coloured tile or chip sets its colour per theme: a light text colour on a dark tint does not
  survive the light theme.
- **A colour that marks a category (a device, an owner, a type) is quieter than the status colours
  and never shares a hue with them,** so a tag is never read as good or bad.

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
- **A row that lights up on hover is clicked as a whole.** The band reaches the same distance past
  the text at both ends, without moving the text off its edges, and the row's link is stretched over
  it (`position: relative` on the row, an `::after` with `inset: 0` on the link). Only for rows that
  hold one link.
- **Hover styles live once, in the stylesheet that owns the control,** never per page: a fix made
  for one checkbox is a fix for every checkbox.
- **Controls repeated in a strip or a set of overlays share one width and one height,** taken from
  the screen width (a strip of eight keys is an eighth of it each), never from each label; a pinned
  control at the end of a scrolling strip keeps the same size as the others.

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
- **Every gap is chosen.** A site writes a small spacing scale (for example 0.25, 0.5, 1, 1.5, 2
  and 3rem) and overrides the base stylesheet's margins onto it; two collapsing default margins are
  how a gap nobody chose appears. Groups are spaced wider than their parts, a heading sits closer
  to what follows it than to what precedes it, and an exception to the scale is written down with
  its reason.
- **Space groups before lines do.** Rows are separated by a gap larger than the line gap inside
  one row before a border, stripe or tint is tried.
- **One frame for every page of a site** (the header, the title block, the gap under it) in one
  component, and a check that measures each page's first content and left edge and fails when
  two pages differ.
- **A change asked for one width leaves the other as it was.** Narrow and wide are two layouts; a
  breakpoint set where content starts to wrap is measured from that content.
- **On a page shorter than the window,** the main area takes the spare height so the footer sits at
  the bottom, without changing the gap above it. A one-line footer that would wrap on a phone
  swaps in shorter text at a container width measured in `em`, and a check fails if it wraps.
- **A small site's navigation names where the reader is:** a breadcrumb of links from home to the
  open page. Know what the base stylesheet does to a nav on a phone before relying on its list
  items.

## 7. Content states

- **Every list has an empty state** that says what goes there and how to add the first one, in one
  sentence, with at most one action.
- **Errors say what is wrong and what to do,** inline beside the field; never `alert()`.
- **Forms ask for the minimum** ("Only the name is needed"); the rest folds away under a `details`
  whose summary names what is inside.
- **Show, don't make the reader edit:** a record is read as a sentence ("₺18,999 at Shop · 2 Mar
  2025") with the edit form folded behind it.

On a profile or personal page:

- **One fact per row:** a short label, the role at its organisation, and dimmed years at the row's
  end, rather than a sentence of joined clauses. No total ("10+ years of …") that the dated rows
  already show.
- **Each row earns its place** by what it adds to the reader's picture; completeness alone is not
  a reason.
- **A name links to that organisation's own live page, or to nothing.** An archive snapshot or a
  dead page argues the thing is gone.
- **A second page exists only for what the first cannot show** (figures, slides); prose that
  restates the CV stays off.
- **Unfinished things are named for what they were,** in the past tense with their years
  ("incomplete"), so no line implies a status that is not current.
- **Fragments take no full stop;** a full sentence keeps its own.
- **The head says what the site is now:** the description and the contact address change when the
  site stops being a blog or an offer.

## 8. Motion

- Transitions on colour and transform only, under 200 ms, none on layout properties.
- `prefers-reduced-motion: reduce` turns motion off.

An effect that runs on its own or answers touch (a moving strip, particles, a tap effect):

- **It costs nothing at rest.** The frame loop stops when nothing moves and when the element is out
  of view (an `IntersectionObserver`); particles come from a fixed pool; a canvas is at most twice
  its CSS size; a device that drops frames gets a smaller effect.
- **It answers every ordinary gesture and breaks none of the page's:** drag moves it, a fling
  throws it, a click toggles it, a vertical swipe still scrolls (`touch-action: pan-y`), and a press
  never starts a selection (`user-select: none`). Listeners on the whole page are passive, so no
  click, scroll or selection is stopped.
- **A change of state gets one physical metaphor,** carried through every part of it (a weight
  that lands, a pick that strikes). An effect whose meaning cannot be named once seen is removed.
- **It belongs to the content that emits it.** Particles start from glyphs, never from spaces or
  separators; they are not clipped by a box or faded by a mask made for something else; their
  colours follow the theme. A canvas that overflows its row is `aria-hidden` and lets clicks through.
- **A reference point lines up with a landmark of the type** (a letter of the heading above) and
  is measured again as each font loads.
- **Values judged by feel are tuned with sliders** shown only on a local host. The owner's picks
  become the defaults in code, and a browser saves only the values that differ from them.

## 9. Behaviour

For a page that is a tool someone uses for hours. The kind-neutral list is in agents-shared's
`interface-behaviour`; what it means on the web:

- **One navigation bar** (a `nav` in the page's `header`), at the same place and size on every page
  of the app; a change of view never moves it. **[check: nav]** needs two or more pages of one app in a
  run and is not part of the default run: `node tools/check-page.mjs --only nav A.html B.html`.
- **A new way to order, filter or browse is a control on the page that exists,** not another page;
  a mode that only browses writes nothing.
- **A count states the item's place** ("3 of 3") and a progress bar counts what is left in the pass
  the reader is in, so it cannot pass 100%.
- **A control either holds a mode or does a thing once, and its label and state say which:** a mode
  is a toggle (`aria-pressed`) that stays visibly on; an action is a button that does not.
- **One verb keeps one meaning across the app.**
- **A message says what is true** ("none yet", not "loading" when nothing loads) and a failure names
  what failed and what to run or press.

## 10. Checking a page

0. **Before writing, open the pages beside it.** A new view in an app is built from that app's
   existing views (their head, cards, buttons, spacing), and a new tool from the sibling tools of the
   same kind. A page that looks nothing like its neighbours is wrong however well it scores.
1. `check-page` at both widths: no findings, or each one fixed or marked `data-check-skip` with a
   reason in a comment beside it.
2. Read the renders (`--shots`): density (is anything crammed?), alignment across a row, and the
   page against the request, line by line.
3. A page served by an app is checked from its server; a page opened from disk is checked as a
   file, the way the reader opens it.

What the check cannot measure stays a reading job: whether the layout is crowded, whether the
hierarchy matches what matters, and whether it does what was asked.

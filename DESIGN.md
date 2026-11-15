# Session Lab — Midnight Lime Design System

> A reusable design reference extracted from the Session Ranges · AMT Lab website.
> “Midnight Lime” is a descriptive name for this custom design, not a purchased theme or third-party template.

## 1. Visual direction

A calm, precise research workspace with charcoal surfaces, soft lime accents, muted typography, and pastel data colors. The interface feels like a professional analysis terminal with generous separation between dense information groups.

- Dark, subtly layered backgrounds.
- Thin borders define cards and sections.
- Lime identifies primary actions, active navigation, and selected states.
- Lavender, blue, and amber identify independent data categories.
- Monospaced numbers make charts and metrics easy to compare.
- Compact controls, restrained corner rounding, and minimal decoration.
- Flat surfaces throughout; reserve shadows and backdrop blur for floating feedback and dialogs.

## 2. Color palette

### Core colors

| Role | Hex | Usage |
| --- | --- | --- |
| Page background | `#0B0F13` | Main canvas |
| Sidebar background | `#0E1318` | Persistent navigation |
| Panel background | `#11161C` | Charts, cards, settings, tables |
| Standard border | `#252C34` | Panel outlines and separators |
| Primary text | `#E7EBED` | Main headings and important content |
| Muted text | `#87919F` | Secondary information and descriptions |
| Primary accent | `#D5EC88` | Main action, active tabs, sliders, highlights |
| Text on primary accent | `#1D2710` | Primary button label |
| Active navigation fill | `#232B21` | Selected sidebar item |
| Secondary button fill | `#192129` | Ordinary actions |
| Secondary button border | `#303A43` | Ordinary action outline |
| Input background | `#0D1217` | Compact numeric fields |
| Input border | `#333D46` | Numeric field outline |
| Notice background | `#151B1C` | Context and data-source banner |
| Notice border | `#293532` | Banner outline |
| Dialog background | `#141B22` | Modal surface |
| Dialog border | `#38434E` | Modal outline |

### Data colors

| Role | Hex | Original mapping |
| --- | --- | --- |
| Lavender | `#B6A0F8` | Asia |
| Soft blue | `#72B6F6` | London |
| Warm amber | `#E9AD70` | New York and reclaim/rejection accents |
| Positive movement token | `#7DBBA9` | Upward price-change text |
| Negative movement token | `#C3828B` | Downward price-change text |
| Positive candle | `#77B6A4` | Up candles in the SVG chart |
| Negative candle | `#BC8189` | Down candles in the SVG chart |

Preserve category colors consistently across charts, badges, dots, and cards. Category badge backgrounds use their color at approximately 9% opacity. Chart session shading uses approximately 3.5% opacity.

## 3. Typography

| Purpose | Font | Weight |
| --- | --- | --- |
| Interface and headings | **DM Sans** | 400, 500, 600, 700 |
| Prices, timestamps, metrics, chart labels | **IBM Plex Mono** | 400, 500 |
| Khmer text | **Noto Sans Khmer** | 400, 500, 600 |

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Khmer:wght@400;500;600&display=swap');

body {
  font-family: 'DM Sans', 'Noto Sans Khmer', sans-serif;
  font-size: 14px;
}

.mono {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 400;
}
```

### Original type scale

| Element | Size | Details |
| --- | --- | --- |
| Page title | 29px | Weight 500; tracking -1px |
| Dialog title | 23px | Moderate emphasis |
| Main chart price | 23px | Monospace |
| Summary metric | 20px | Monospace; tracking -0.5px |
| Full-view section title | 20px | Weight 500 |
| Panel title | 14px | Weight 500 |
| Body base | 14px | Regular |
| Supporting paragraphs | 12px | Line height 1.8 |
| Standard button | 12px | Primary weight 700 |
| Navigation | 12px | Compact labels |
| Tabs and breadcrumbs | 11px | Quiet supporting text |
| Form labels and table cells | 10px | Dense dashboard layout |
| Eyebrows | 9px | Uppercase; tracking 1.8px |
| Parameter group headings | 9px | Uppercase; tracking 1.3px |
| Badges and table headings | 8–9px | Compact metadata |

These sizes document the original compact desktop design. For a more readable or touch-focused adaptation, increase small labels to 12–14px and enlarge hit areas while preserving hierarchy. Validate contrast and focus visibility in the new implementation.

## 4. Layout blueprint

```text
┌──────────────────┬───────────────────────────────────────────┐
│ Brand            │ Breadcrumb             Export · Profile   │
│                  ├───────────────────────────────────────────┤
│ Workspace label  │ Eyebrow                                    │
│ Navigation      │ Page title                  Primary action │
│                  │ Supporting description                    │
│                  │ Context / data-source notice              │
│                  │                                           │
│                  │ Summary card · Summary card · Summary card│
│                  │                                           │
│                  │ Main chart / visualization  │ Parameters  │
│                  │ Legend and playback controls│             │
│                  │                             │             │
│                  │ Tabs and detail table       │             │
│ Footer note      │ Status footer                             │
└──────────────────┴───────────────────────────────────────────┘
```

### Desktop dimensions

- Fixed sidebar: **218px** wide.
- Header: **74px** high, **32px** horizontal padding.
- Main content: maximum **1800px**, centered within the remaining area.
- Page padding: **30px vertical / 32px horizontal**.
- Three equal summary columns with **16px** gaps.
- Main analysis grid: flexible visualization column plus **282px** settings column.
- Analysis grid gap: **20px**.
- Chart height: **325px**, increasing to **390px** at viewport widths of 1600px or more.
- Summary card padding: **16px / 19px**.
- Panel header padding: **17px / 18px**.
- Settings body padding: **16px / 18px**.

## 5. Component recipes

### Navigation

Use a dark vertical rail with a small brand mark, uppercase workspace label, and icon-plus-text links. Selected items use an olive-tinted background and lime text. Keep secondary information near the bottom.

### Summary cards

Use a dark panel with a 1px border and 7px radius. Add a 2px category-colored stripe along the left edge, inset 18px from the top and bottom. Place the category name and a tinted status badge above two monospaced metrics. Separate footer metadata with a thin line.

### Buttons

- **Primary:** lime fill, dark green text, weight 700, 6px radius, 10px vertical and 15px horizontal padding.
- **Secondary:** charcoal fill, thin gray border, same shape.
- **Tertiary:** muted text with no filled container; lime on hover.
- **Icon controls:** simple compact symbols, consistent alignment.
- **Hover:** slight brightness increase; ordinary button borders shift toward muted olive.
- **Disabled:** 40% opacity and default cursor.

### Tabs and segmented controls

Underline tabs use muted labels and a 2px lime active underline. Segmented controls sit in a darker inset container with 3px padding; selection uses a raised charcoal fill and brighter text.

### Forms

Align labels left and small value fields right. Keep unit suffixes inside the field wrapper. Use thin lime range sliders and compact switches. Separate parameter groups with lines and tracked uppercase headings.

### Charts

Use muted candles, faint dashed grid lines, and monospaced axis labels. Show sessions with barely visible color washes. Use solid lines for session boundaries, dotted lines for interactions, and a bright lime chip for the current value. Distinguish event types with shapes as well as colors: crosses, diamonds, and circles.

### Tables and state flags

Use compact uppercase headers, subtle row separators, and aligned numeric columns. Positive flags use a soft green tint; inactive flags use slate gray. Combine text labels with color rather than relying on color alone.

### Dialogs and feedback

Dialogs use a 12px radius, 30px padding, a maximum width of 600px or 90vw, and a maximum height of 85vh. The backdrop uses `#02060BBD` with 4px blur. Toasts appear at the bottom center with lime fill, dark text, a 6px radius, and a 200ms opacity transition. Switch transitions take 150ms.

## 6. Responsive behavior

| Viewport | Changes |
| --- | --- |
| 1600px and above | Chart grows to 390px high |
| 1200px and below | Sidebar becomes 180px; page padding 24px / 22px; settings column 255px |
| 1000px and below | Sidebar becomes a 70px icon rail; settings column 250px; saved cards use two columns |
| 760px and below | Navigation becomes a 58px top row; header becomes 54px; page padding 23px / 14px |
| Mobile content | Chart, detail table, then parameters stack vertically; saved cards become one column |
| Mobile summaries | Retain three compact cards; stack high/low values within each card |
| Mobile chart | Height 310px; legends wrap; tables scroll horizontally |

## 7. Reusable CSS tokens

```css
:root {
  --bg: #0b0f13;
  --sidebar: #0e1318;
  --panel: #11161c;
  --line: #252c34;
  --text: #e7ebed;
  --muted: #87919f;
  --lime: #d5ec88;
  --asia: #b6a0f8;
  --london: #72b6f6;
  --ny: #e9ad70;
  --up: #7dbba9;
  --down: #c3828b;

  /* Reusable names distilled from the original component values. */
  --radius-control: 6px;
  --radius-panel: 7px;
  --radius-dialog: 12px;
  --sidebar-width: 218px;
  --settings-width: 282px;
  --content-gap: 20px;
  --font-ui: 'DM Sans', 'Noto Sans Khmer', sans-serif;
  --font-data: 'IBM Plex Mono', monospace;
}
```

## 8. Copy-and-reuse design prompt

> Build [PROJECT NAME] using the Midnight Lime design system from Session Lab. Create a calm, polished analysis workspace with a #0B0F13 canvas, #0E1318 navigation, #11161C panels, thin #252C34 borders, #E7EBED primary text, and #87919F secondary text. Use #D5EC88 lime for primary actions and selected states. Use #B6A0F8 lavender, #72B6F6 blue, and #E9AD70 amber consistently for data categories. Use DM Sans for the interface, IBM Plex Mono for numbers and timestamps, and Noto Sans Khmer for Khmer text. Keep headings medium-weight, numeric metrics prominent, and section labels compact and tracked. Arrange a fixed left navigation rail, quiet top header, title with one primary action, three summary cards, a dominant visualization, a narrow settings panel, and tabbed details. Use 6–8px component radii, 1px borders, 16–24px internal spacing, restrained hover states, and subtle chart shading. Adapt the layout to mobile with top navigation and stacked content. Preserve the visual hierarchy while ensuring readable text, accessible controls, and clear keyboard focus. Replace the domain content and workflows with [DESCRIBE YOUR APP].

## 9. Fidelity checklist

- [ ] Dark surfaces have subtle separation.
- [ ] Lime remains the main action and selection color.
- [ ] Data categories keep consistent pastel colors.
- [ ] Numbers use IBM Plex Mono.
- [ ] Khmer text uses Noto Sans Khmer.
- [ ] Cards use fine borders and modest corner radii.
- [ ] The main visualization receives the most space.
- [ ] Controls align neatly and include units.
- [ ] Status information uses text or shapes alongside color.
- [ ] Hover, focus, disabled, empty, and error states are defined.
- [ ] Mobile content remains readable and usable.

## Reference

- Original site: https://session-ranges-lab-kh.humble-skunk-7279.chatgpt.site
- Original stylesheet: `session-ranges-lab/dist/style.css` (relative to this document).
- Chart rendering colors: `session-ranges-lab/dist/app.js` (relative to this document).
- This document records the existing design and provides a reusable prompt; it does not alter the published website.
 

---
name: Smart Expense Tracker
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-num:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system embodies a calm, precise, and understated editorial financial instrument. Designed for high-frequency mobile web interactions, it shifts personal financial management from stress-inducing vigilance to quiet clarity. The aesthetic draws heavily from contemporary modern minimalism and structured Scandinavian utility, prioritizing structural order, whitespace, and immediate legibility over decorative flourishes.

The interface evokes competence, trust, and psychological ease. Visual noise is strictly eliminated: positive feedback is reassuring without being celebratory, and negative financial signals (overspending, debt balance warnings) are conveyed with measured clarity rather than alarming hostility. 

Key attributes defining the experience:
- **Atmospheric Calm:** Subdued canvas tones (#F8FAFC) minimize optical glare, framing user data within crisp, white card surfaces.
- **Data Clarity:** Information density is controlled through disciplined typographic scaling and tabular alignments rather than heavy framing or excessive iconography.
- **Architectural Precision:** Structural boundaries rely on hairline outlines and subtle value shifts rather than deep drop shadows or skeuomorphic depth.

## Colors

The color architecture is built around neutral, low-strain canvas surfaces, high-contrast slate ink, and targeted semantic accents. Color is never decorative; it functions strictly as a directional or state indicator.

### Core Swatches & Semantics

- **Primary Canvas & Surfaces:**
  - Light Mode: `#F8FAFC` (Canvas/Background), `#FFFFFF` (Surface Elevated/Card), `#F1F5F9` (Surface Subdued/Input wells).
  - Dark Mode: `#0B0F17` (Canvas/Background), `#111827` (Surface Elevated/Card), `#1E293B` (Surface Subdued/Dividers).
- **Ink & Typography:**
  - Primary Ink: `#0F172A` (Light) / `#F8FAFC` (Dark). Used for titles, core balances, and active labels.
  - Secondary Ink: `#475569` (Light) / `#94A3B8` (Dark). Used for supportive metadata and category indicators.
  - Muted Ink: `#94A3B8` (Light) / `#64748B` (Dark). Used for placeholders, inactive states, and timestamps.
- **Functional Accents:**
  - **Growth / Positive / Primary Action (`#059669` light, `#10B981` dark):** Reserved for primary interactive buttons, net positive cash flow, deposit transactions, and completed budget targets.
  - **Expense / Deficit (`#E11D48` light, `#F43F5E` dark):** Deployed strictly for over-budget warnings, negative ledger differentials, and irreversible destructive actions.
  - **Attention / Pending (`#D97706` light, `#F59E0B` dark):** Designates unverified account syncs, approaching budget limits (85%+), or scheduled future debits.
- **Structural Outlines:**
  - Crisp boundary definition via `#E2E8F0` (Light) and `#1E293B` (Dark).

## Typography

The typographic system utilizes **Inter** across all roles to achieve a unified, neutral, and precise financial interface. 

To prevent visual jump when metrics update and to ensure absolute columnar precision across ledgers, tables, and budget comparisons, **tabular numbers** (`font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1, "cv05" 1`) are globally mandated for all currency displays, percentages, dates, and balance tallies.

### Typographic Roles
- **Display & Large Headlines:** Reserved for primary net worth snapshots and total monthly summaries. Kept compact with slight negative tracking to ensure monetary values remain scannable on mobile viewports.
- **Metrics (`metric-num`):** Dedicated token applied to transactional values, budget cards, and metric callouts.
- **Labels (`label-sm`):** Utilized for metadata tags, category badges, and transaction status indicators; renders with subtle letter spacing and medium/semibold weight for rapid identification.

## Layout & Spacing

This design system uses a responsive fluid grid optimized for mobile web viewports with an 8pt vertical rhythm (supplemented by 4px half-steps for micro-alignments).

### Breakpoints & Layout Adapters
- **Mobile Handset (< 640px):** Single-column layout. Outer page margin is fixed at `1rem` (16px) with an inner element gutter of `1rem`. Content stretches fully between safe bounds to maximize tap target dimensions and financial scan path.
- **Tablet / Large Handset (640px – 1024px):** 2-to-4 column fluid grid. Outer margin increases to `1.5rem` (24px). Metric summaries collapse into 2-up responsive horizontal pairings.
- **Desktop Dashboard (> 1024px):** Max container constraint of `1120px` centered on canvas. 12-column grid system with `1.5rem` gutters and `2rem` margins. Primary feed defaults to an 8-column ledger paired with a 4-column persistent budget breakdown sidebar.

### Vertical Rhythm & Density
- Row heights in transaction lists are locked to a minimum touch-safe dimension of 56px.
- Internal component padding leverages `space-lg` (16px) for card containers and `space-md` (12px) for interactive pills and input text fields.

## Elevation & Depth

This design system rejects heavy, colored, or multi-stop drop shadows. Visual depth is established through a strict **low-contrast outline and tonal layering** discipline.

### Depth System Rules
1. **Layer 0 (Canvas Base):** Ground level. `#F8FAFC` (Light) / `#0B0F17` (Dark).
2. **Layer 1 (Card & Module Surfaces):** Raised structural units. Rendered in pure `#FFFFFF` (Light) / `#111827` (Dark) with a continuous 1px outline: `border: 1px solid #E2E8F0` (Light) / `border: 1px solid #1E293B` (Dark). No elevation shadow is cast in resting state.
3. **Layer 2 (Floating Sheets & Popovers):** Mobile bottom action sheets, date pickers, and context menus. Uses surface color paired with the system's singular ambient shadow: `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 0 1px 1px rgba(15, 23, 42, 0.04)`.
4. **Dividers & Structural Separators:** Internal dividers within cards use 1px hairlines tinted at `#F1F5F9` (Light) and `#1E293B` (Dark). Borders never cross outer container bounds.

## Shapes

The geometric framework balances human warmth with the calculated precision of an analytical dashboard. A standard roundedness level of `2` (0.5rem base radius) is systematically applied to maintain visual harmony.

### Shape Geometry Rules
- **Cards & Data Modules:** `rounded-lg` (1rem / 16px) for standard cards, account summaries, and modal viewports.
- **Interactive Inputs & Primary Buttons:** `rounded` (0.5rem to 0.75rem / 8px to 12px) balancing tap ergonomics with structure.
- **Pills, Badges & Chips:** Fully pill-shaped (`rounded-full` / 9999px) to visually distinguish categorical states and filter parameters from actionable content boxes.
- **Nested Corner Concurrency:** Child elements placed within padded parent containers must follow radius scaling: `r_inner = r_outer - padding` to prevent visual corner collision.

## Components

### Buttons
- **Primary:** Background `#059669`, text `#FFFFFF`, border none. Minimum height: 44px (touch-target 48px). Flat resting state. Active/Pressed state darkens to `#047857`. Focus ring: 2px offset with `#10B981`.
- **Secondary:** Surface `#FFFFFF` (Light) / `#111827` (Dark), text `#0F172A`, 1px border `#E2E8F0`. Hover shifts background to `#F8FAFC`.
- **Ghost / Tertiary:** Transparent background, text `#475569`, 0px border. Active state: background `#F1F5F9`.

### Chips & Filter Pills
- **Filter Chip:** Pill-shaped (`rounded-full`), height 32px, text `label-md`. Unselected: border 1px solid `#E2E8F0`, surface `#FFFFFF`, text `#475569`. Selected: surface `#0F172A`, border 1px solid `#0F172A`, text `#FFFFFF`.
- **Category Badge:** Pill-shaped, height 24px, text `label-sm`. Low-chroma backgrounds with high-contrast text (e.g., `#ECFDF5` background with `#065F46` ink for 'Income').

### Lists & Transaction Rows
- Structured for rapid scanning. Container: 0-margin table or card stack.
- Left slot: 40px rounded-lg container (`#F1F5F9`) hosting a 20px line-based icon (1.5px stroke width).
- Center slot: Title (`label-lg`) stacked over category and date (`body-sm`, `#64748B`).
- Right slot: Right-aligned tabular value (`metric-num`). Debits render in standard ink (`#0F172A`); credits/deposits render in emerald (`#059669`); overspend indicators attach a subtle coral tag (`#E11D48`).

### Input Fields & Controls
- **Form Inputs:** 44px height, background `#FFFFFF`, border 1px solid `#E2E8F0`, `rounded` (8px). Text: `body-md`. Focus state shifts border directly to `#059669` without heavy drop shadow (optional 1px ambient glow).
- **Currency Input (Hero):** Borderless, centered or left-aligned, text `display-lg`, placeholder `#94A3B8`. Tabular alignment strictly enforced.
- **Checkboxes & Radios:** 18px x 18px, 1.5px border `#CBD5E1`. Checked state: background `#059669` with crisp white check glyph.

### Cards & Financial Containers
- Enclosed with a 1px border (`#E2E8F0`), zero box-shadow, padding `1rem` (mobile) to `1.5rem` (desktop).
- Header row separates metric title (`label-md`, uppercase, muted) from auxiliary menu icons.

### Budget Progress Bar
- 6px height track with `rounded-full`. Track background: `#F1F5F9` (Light) / `#1E293B` (Dark). 
- Fill color is contextual:
  - Normal spend (< 85%): `#059669`
  - Approaching limit (85%–99%): `#D97706`
  - Overspent (>= 100%): `#E11D48`
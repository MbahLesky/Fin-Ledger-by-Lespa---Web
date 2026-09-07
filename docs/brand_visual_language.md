# Brand and Visual Language

*Monilog*

## Purpose

This document defines the current brand, color, typography, theme, and product-writing direction for Monilog so future UI work stays visually and verbally consistent.

It complements the structural screen guidance in `interface_design_ui_flow.md` by focusing on how the product should look and sound.

## Brand Foundation

### Product Name

- use `Monilog` as the full product name in headings, auth copy, and external documentation
- use `ledger` only when space is tight and the meaning is already clear from context
- avoid switching between multiple public names for the product

### Core Promise

Monilog should feel like the fastest calm place to record money movement and understand what changed.

### Tagline

**Make financial tracking as easy as sending a message.**

### Brand Personality

Monilog should feel:

- calm
- trustworthy
- practical
- clear
- encouraging
- lightweight

Monilog should not feel:

- preachy
- overly corporate
- noisy
- gimmicky
- judgmental about spending behavior

## Positioning

Monilog is a simple personal finance tracker, not a full accounting platform. The experience should communicate:

- quick capture over complex setup
- useful clarity over dense reporting
- habit-building over financial pressure
- approachable structure over technical jargon

## Color System

Teal leads. It is the identity color on the marketing site, in both apps, and in
the WhatsApp guide. Deep blue is kept for depth rather than as the anchor color.

| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| Primary | `#08D2B5` | brand teal | identity, navigation, primary CTA, selected states, fills |
| Secondary | `#08867F` | deep teal | income, positive movement, and teal wherever it must read as text on a light surface |
| Accent | `#E1644C` | coral | expense highlights, alerts, destructive actions |
| Deep Blue | `#173B7A` | depth | shadows, gradient anchors, dark structure |
| Light Background | `#F3F6FB` | calm canvas | default app background in light mode |
| Dark Background | `#08111F` | low-glare canvas | default app background in dark mode |
| Dark Surface | `#101C2F` | elevated dark surface | cards, sheets, and panels in dark mode |

### Color Intent

- teal is the anchor color and carries the brand: navigation, the main action, and the sense that the product is quick and calm
- the deep teal is the same color where contrast requires it — `#08D2B5` on white is too light to read as text, so text, links and income figures use `#08867F` while fills, highlights and dark surfaces use the brand teal
- coral is the alert color and should be used carefully for spending, warnings, and high-attention details
- blue no longer leads, but has not been retired: it gives depth to shadows and gradients, where a saturated teal would shout
- large surfaces should stay soft and restrained so transaction data remains the focus

### Contrast

Anything rendered *in* the brand teal on a light background must use the deep
teal instead. Filled controls are fine either way — a teal fill takes dark ink,
which is why `--primary-foreground` in the web app and Material's derived
`onPrimary` in the Flutter app are both dark rather than white.

### Semantic Color Rules

- use `primary` for core navigation, hero areas, and the main confirmation path
- use `secondary` for income, healthy progress, synced/safe states, and supportive emphasis
- use `accent` or error tones for expense-heavy views, destructive actions, and risk messaging
- avoid using the accent color as a full-screen background
- keep charts and summaries readable before making them decorative

### Gradient Direction

When a gradient is needed, the preferred brand direction is:

- `primary -> secondary` for hero cards and welcoming moments
- subtle opacity overlays rather than loud multi-color blends

## Typography

### Font Direction

- primary typeface: `Poppins`
- current implementation uses Google Fonts and should remain consistent until the design system changes intentionally

### Typographic Feel

Typography should feel modern and friendly, but still stable enough for financial information.

- headings: strong and confident
- labels: compact and readable
- body text: plain, warm, and easy to scan
- numbers: visually prominent, especially balance and amount values

### Weight Guidance

- large headings: `700`
- section titles: `600`
- body text: regular with comfortable line height
- buttons and strong labels: `600` to `700`

### Case and Formatting

- use sentence case in UI labels and actions
- avoid all-caps navigation or buttons
- keep labels short and literal
- currency values should be easier to notice than descriptive text around them

## Theme Direction

### Overall Mood

The theme should feel clean, composed, and reassuring. Users should feel like they are looking at a clear personal money dashboard, not a banking back office and not a playful budgeting game.

### Light Theme

- light mode should remain the default product experience
- use airy backgrounds and white cards to keep data easy to scan
- maintain visible depth through borders, spacing, and grouped sections instead of heavy shadows

### Dark Theme

- dark mode should feel deliberate, not inverted for the sake of feature parity
- use softened blue, teal, and coral accents rather than harsh neon
- preserve contrast for balances, charts, and inputs before adding extra decoration

### Shape and Surface Language

The current UI language already suggests:

- rounded cards
- soft filled inputs
- medium-to-large corner radii
- minimal shadows
- calm spacing between sections

These choices should remain part of the brand unless a broader redesign is approved.

## UI Writing and Copy Style

### Voice

Product copy should sound:

- direct
- supportive
- human
- low-friction
- non-judgmental

### Writing Principles

- say what is happening in plain language
- tell the user what they can do next
- prefer reassurance over hype
- be specific when something is blocked or unavailable
- keep empty states useful instead of decorative

### Good Copy Patterns

- `Welcome back`
- `Choose Your Currency`
- `Set Your Starting Balances`
- `Add your first income or expense to get started.`
- `Authentication is unavailable until a valid Supabase project URL and publishable key are configured.`

These work because they are short, specific, and action-oriented.

### Copy Rules for Key Moments

**Buttons and actions**

- start with a verb when possible
- prefer `Log In`, `Register`, `Continue setup`, `Import data`, `Add transaction`

**Empty states**

- explain the situation clearly
- include one obvious next step

**Errors**

- explain the problem in plain language
- avoid blaming the user
- include recovery guidance whenever possible

**Coming-soon features**

- keep future entry points visible if product strategy requires it
- clearly say the feature is not active yet
- route users back to the working path without confusion

### Words to Avoid

- avoid finance jargon unless it saves more confusion than it creates
- avoid scolding language such as `You must manage your spending better`
- avoid vague filler such as `Something went wrong` when a more specific message is available
- avoid overly promotional phrases that make a simple ledger feel like a marketing site

## Visual Components and Imagery

### Component Feel

Shared UI elements should continue to lean on:

- card-based grouping
- clear section titles
- compact summary blocks
- quick actions with obvious labels
- icons that clarify meaning without becoming decoration

### Icon Direction

- use simple rounded or outlined icons
- choose icons that reinforce finance concepts quickly
- do not mix too many icon styles on the same screen

### Imagery Direction

If illustrations or marketing visuals are added later, they should feel:

- clean
- optimistic
- mobile-first
- practical rather than luxurious

Avoid stock imagery that makes the product feel like a bank, a crypto app, or a high-pressure fintech ad.

## Brand Consistency Rules

- every new screen should follow the same primary, secondary, and accent color roles
- every new user-facing message should match the calm and practical copy tone
- every major design update should check this document together with `interface_design_ui_flow.md`
- if the palette or typography changes in code, update this document and every place that implements it, together:

| Surface | Palette | Typeface |
| --- | --- | --- |
| Flutter app | `lib/core/theme/app_theme.dart` | `google_fonts` |
| Web app | `src/app/styles.css` (HSL custom properties) | `@import` at the top of the same file |
| Landing page | `tailwind.config.js` and `app/globals.css` | `next/font/google` in `app/layout.jsx` |

The landing page is the reference for how the palette should feel in the wild;
it is where the brand teal has always been used as intended.

## Summary

Monilog's brand direction is calm, trustworthy, and lightweight. Visually it relies on deep blue structure, teal support, coral emphasis, soft surfaces, and rounded components. Verbally it should always sound clear, helpful, and low-pressure.

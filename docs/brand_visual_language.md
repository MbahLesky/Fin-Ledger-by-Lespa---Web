# Brand and Visual Language

*Finance Ledger*

## Purpose

This document defines the current brand, color, typography, theme, and product-writing direction for Finance Ledger so future UI work stays visually and verbally consistent.

It complements the structural screen guidance in `interface_design_ui_flow.md` by focusing on how the product should look and sound.

## Brand Foundation

### Product Name

- use `Finance Ledger` as the full product name in headings, auth copy, and external documentation
- use `ledger` only when space is tight and the meaning is already clear from context
- avoid switching between multiple public names for the product

### Core Promise

Finance Ledger should feel like the fastest calm place to record money movement and understand what changed.

### Tagline

**Make financial tracking as easy as sending a message.**

### Brand Personality

Finance Ledger should feel:

- calm
- trustworthy
- practical
- clear
- encouraging
- lightweight

Finance Ledger should not feel:

- preachy
- overly corporate
- noisy
- gimmicky
- judgmental about spending behavior

## Positioning

Finance Ledger is a simple personal finance tracker, not a full accounting platform. The experience should communicate:

- quick capture over complex setup
- useful clarity over dense reporting
- habit-building over financial pressure
- approachable structure over technical jargon

## Color System

The app already has an implementation baseline in `lib/core/theme/app_theme.dart`. That palette should remain the source of truth for now.

| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| Primary | `#173B7A` | trust, structure, navigation | primary CTA, app identity, headers, selected states |
| Secondary | `#0F8C83` | progress, stability, positive movement | income, success, supporting highlights |
| Accent | `#E1644C` | urgency, emphasis, spending attention | expense highlights, alerts, important contrast points |
| Light Background | `#F3F6FB` | calm canvas | default app background in light mode |
| Dark Background | `#08111F` | low-glare canvas | default app background in dark mode |
| Dark Surface | `#101C2F` | elevated dark surface | cards, sheets, and panels in dark mode |

### Color Intent

- blue is the anchor color and should communicate trust, control, and clarity
- teal is the optimistic color and should be used for positive financial movement and supportive actions
- coral is the alert color and should be used carefully for spending, warnings, and high-attention details
- large surfaces should stay soft and restrained so transaction data remains the focus

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
- if the palette or typography changes in code, update this document and `lib/core/theme/app_theme.dart` together

## Summary

Finance Ledger's brand direction is calm, trustworthy, and lightweight. Visually it relies on deep blue structure, teal support, coral emphasis, soft surfaces, and rounded components. Verbally it should always sound clear, helpful, and low-pressure.

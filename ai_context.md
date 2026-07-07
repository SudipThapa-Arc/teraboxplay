# Context
Project Name: TeraPlay
Domain: teraplay.io
Stack: Astro (v4+), Tailwind CSS v4, TypeScript
Design System: Figma Editorial (Editor-clean monochrome frame, figmaSans typography accents, oversized hand-cut pastel color blocks, pill-shaped CTAs)[cite: 1]
Reference Guidance: Follow updated theme configuration rules below.

# Goal
Build frontend layout, interactive player container, and utility controls for "TeraPlay" matching the Figma design vocabulary[cite: 1]. Focus entirely on high-fidelity visual composition with mock data structures ready for backend hookups[cite: 1].

# Theme Tokens & CSS Injection
Inject these custom design properties into your Tailwind configuration or global stylesheet:

- Colors[cite: 1]:
  * Canvas: `#ffffff` (Base background)[cite: 1]
  * Ink: `#000000` (All typography on light backgrounds)[cite: 1]
  * Hairline: `#e6e6e6` (Input & grid structural lines)[cite: 1]
  * Block Lime: `#dceeb1` (Hero link terminal background)[cite: 1]
  * Block Lilac: `#c5b0f4` (Media streaming player canvas block)[cite: 1]
  * Block Navy: `#1f1d3d` (History tracking database card section)[cite: 1]
- Border Radius[cite: 1]:
  * `rounded-md`: 8px (Form items, video canvas wrapper)[cite: 1]
  * `rounded-lg`: 24px (Large block panels)[cite: 1]
  * `rounded-pill`: 50px (All text CTAs)[cite: 1]
- Typography[cite: 1]:
  * Display: figmaSans, heavy negative tracking (`tracking-[-1.72px]` or `tracking-[-0.96px]`)[cite: 1]
  * Taxonomy Eyebrows: figmaMono, all-caps, positive letter-spacing (`tracking-[0.54px]`)[cite: 1]

# Execution Workflow (Do Not Deviate)

## Phase 1: Structural UI Re-Skinning (Priority 1)
Build out the visual structure using the Figma system[cite: 1]. Absolutely no drop shadows on blocks, no custom gradients, no mid-gray body text[cite: 1]. Use font-weight and pure black lines for contrast[cite: 1].

1. Header Layer (`top-nav`)[cite: 1]:
   - 56px height, white canvas, fine `#e6e6e6` baseline boundary rule[cite: 1].
   - Left side: "TeraPlay" brand wordmark set in display-weight sans[cite: 1].
   - Right side: Secondary pill button (`button-secondary` in white) alongside primary black pill button (`button-primary`)[cite: 1].
2. Marquee Ticker (`marquee-strip`)[cite: 1]:
   - 36px pure black strip running immediately below navigation showing active status metrics in inverse white text[cite: 1].
3. Hero Processing Zone (`color-block-section` in Lime)[cite: 1]:
   - Full content-width panel utilizing `#dceeb1` background surface with 24px rounded corners (`rounded-lg`)[cite: 1].
   - Central input terminal component (`text-input`) styled flat white with sharp 8px corners[cite: 1].
   - Execution button: `button-primary` styled as a crisp black pill (`rounded-pill`)[cite: 1].
4. Universal Media Workspace (`color-block-section` in Lilac)[cite: 1]:
   - Hidden by default, slides open via template rendering flag.
   - Sits on `#c5b0f4` background canvas with generous interior padding[cite: 1].
   - Left Block (Media Stage): Plyr engine wrapper with clean 8px radius corners holding streaming video/audio layout containers[cite: 1].
   - Right Block (Metadata Drawer): Pure white canvas cards (`#ffffff`) framed with `#e6e6e6` borders displaying file information[cite: 1].
5. Active Tracking Logs (`color-block-section` in Navy)[cite: 1]:
   - Deep indigo ground container (`#1f1d3d`) holding historical link tables[cite: 1].
   - Typography flips to inverse white ink[cite: 1]. Columns separated cleanly by subtle white-opacity boundary strokes[cite: 1].

### Critical Action: Apply Impeccable Pass
Once functional components and layout tokens are arranged, invoke your internal `impeccable` layout polish mechanisms. Confirm precise typography tracking values, strict 44px vertical tap dimensions for pills, and correct macro grid gutters[cite: 1].

## Phase 2: State Handlers for Future Supabase Synchronization
Structure state values inside components using standalone async placeholder actions.
- Map links to: `async function handleFetchLink(rawUrl: string): Promise<void>`
- Map auth cards to: `async function handleAuthAction(mode: 'signin' | 'signup'): Promise<void>`
- Ensure data loops pass properties that exactly match production target tables (`original_url`, `resolved_url`, `file_name`, `file_size`, `media_type`).
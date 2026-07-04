# Context
Project Name: TeraPlay
Domain: teraplay.io / teraplay.net
Stack: Astro (v4+), Tailwind CSS v4, TypeScript
Backend Target: Supabase (Auth, DB, Edge Functions)
Design System: Vercel-like (Monochrome, high contrast, #000000 canvas, #ffffff text, geometric 1px borders, Inter font, minimal utility spacing, zero decoration)
Reference Guidance: Follow `@DESIGN.md` rules and `web-design-guidelines`.

# Goal
Build frontend architecture, responsive layout, universal media player interface, and mock API data store layer for "TeraPlay" — utility tool bypassing forced app blocks to parse, stream, and download TeraBox links directly in-browser.

# Implementation Workflow & Constraints
1. Phase 1: Frontend Only. Hardcode clean mock datasets for video/audio file metadata, active streaming states, and historical links.
2. Architecture Hooking: Abstract all data actions into centralized state engine (Nano Stores or TypeScript signals). Code frontend elements using clear reactive functions (e.g., `async function handleFetchLink(url: string)`) so backend REST/Supabase client hooks integrate directly later.
3. Final Step: Once structural layout and logic states are written, run `impeccable` skill over the repository to polish micro-interactions, enforce sharp grid borders, clean up typography line-heights, and normalize Vercel spacing metrics.

# Layout Requirements (Vercel Core UI Style)
1. Header / Navigation:
   - Fixed top layout, thin boundary border.
   - Logo left side, active streaming status indicator badge center, placeholder "Sign In / Sign Up" utility buttons right side.
2. Hero Terminal (Input Area):
   - Center-stage minimalist URL input container.
   - High-contrast button "Fetch & Stream".
   - Underneath: Supported types status tags (Video, Audio, Docs).
3. Core Media Workspace:
   - Hidden by default, slides open via state flag.
   - Left side (65% width): Fixed-aspect player wrapper skin (Video.js/Plyr style blueprint). Native layout container supporting both video canvas and minimalist audio waveform bar tracker.
   - Right side (35% width): Technical metadata card block showing properties: File Name, Size (GB/MB), Media Extension, Server Mirror status.
4. Historical Data Grid:
   - Bottom half: Persistent high-contrast tabular list displaying past links. Include clear filter options ("All", "Videos", "Audio"). Columns separated by sharp 1px vertical rules.
5. Auth Modals (Wireframe Layer):
   - Clean, border-heavy overlays for Email/Password Sign Up and Log In. Hook forms up to handle passive state changes.

# Technical Mock Framework & Schemas
1. HLS Stream Mocking:
   - Player must read direct links. For Phase 1, pass public test `.mp4` or `.m3u8` files to simulate high-performance streaming engine operations.
2. Proxy Download Component:
   - Map download buttons to a specific download trigger callback. Simulate proxy hand-off structure that passes download tokens.
3. Supabase Schema Target Mirroring:
   - Ensure component tables read records mapping exactly to these keys:
     * `history`: `{ id, user_id, original_url, resolved_url, file_name, file_size, media_type, created_at }`
     * `bookmarks`: `{ id, user_id, history_id, created_at }`

# Feature Integration (The 3 Extraction Routes)
Method 1: Direct CDN Bypass (Auto-Fetch)
- Clicking "Fetch" triggers loading overlay animation -> switches mockup state from "idle" to "playing". Shows stream details inside metadata card.

Method 2: Cookie/Session Mirroring (Token Gateway)
- Include mock console log text output inside player view panel: "Establishing proxy tunnel... Injecting authorization headers... Secure token verified."

Method 3: Multi-Mirror Alternate Stream Selector
- Dropdown selector sitting below media frame. Toggling options updates stream target state without reloading the component container.

# Feature Enhancements (Beating iTeraPlay)
- Intrusive Ad Shielding: Absolute zero commercial clutter. UI layout optimized entirely for fast extraction utilities.
- Format Diversity Toggle: Ensure metadata block correctly displays custom icons for file variations (Video track vs Audio track).
- Adaptive Quality Switcher: UI selector options for 480p, 720p, and 1080p stream simulations.
# Trip Advisory — Project Brief

## Who
Pete (Piman Pulsirisombut) — trip planner for a group adventure to East Java, Indonesia.

## What This Folder Is
Trip planning workspace for the **Bromo Adventure Trip, June 2026**.
All files here are trip-related documents, web pages, and assets for the group.

---

## The Trip

**Destination:** East Java, Indonesia  
**Dates:** 11–16 June 2026 (6 days, 5 nights)  
**Group:** 10 people — IE Friends  
**Tour Operator:** Bromo Taxi (Facebook: Bromo Taxi) — all-inclusive package  
**Price:** IDR 2,850,000/person (~5,300 THB) for 10 people  

**Confirmed Itinerary:**
- Jun 11 — Bangkok (DMK) → Bali transit → Surabaya (Juanda, ~20:00) · Hotel: Grand Whiz Hotel Praxis Surabaya
- Jun 12 — Pickup at hotel 09:00 → Madakaripura Waterfall → Bromo area (Cemoro Lawang overnight)
- Jun 13 — Bromo Sunrise 03:00 → Transfer to Tumpak Sewu area
- Jun 14 — Kapas Biru → Teras Semeru → Tumpak Sewu → Drive to Bondowoso (Ijen area)
- Jun 15 — Ijen Blue Fire 00:00 start → Back to Surabaya
- Jun 16 — Departure, flight 17:50 from SUB

**Tour includes:** Transport, 4 nights hotel, Jeep 4WD, all guides, all entrance fees, gas mask, headlamp, Ijen health cert, breakfast, water  
**Not included:** Lunch, dinner, personal expenses  

**6 Destinations:** Madakaripura · Bromo · Kapas Biru · Teras Semeru · Tumpak Sewu · Kawah Ijen  
**Flights:** BKK (DMK) → Bali (SL258, 06:50–12:10) → Surabaya (JT923, 19:55–19:55)

---

## Project Structure

### Entry Point
| File | Purpose |
|---|---|
| `index.html` | Main entry — login overlay (Trip Member / Viewer roles) + tab shell |
| `css/main.css` | All styles for the entire app |
| `js/app.js` | Auth, tab lazy-loading, Pack Up, Wear, and Memo logic |
| `outfit-guide.txt` | Outfit breakdown per day — plain text reference |

### Tabs (lazy-loaded into index.html)
| File | Tab | Description |
|---|---|---|
| `tabs/overview.html` | Overview | Hero + trip summary + highlights |
| `tabs/itinerary.html` | Itinerary | Day-by-day timeline (Day 0–5) |
| `tabs/spots.html` | Spots | 6 destination cards with details |
| `tabs/packup.html` | Pack Up | Packing list with checkboxes, per-member save |
| `tabs/wear.html` | Wear | What to wear per destination, lightbox gallery |
| `tabs/memo.html` | Memo | Member memo shell — rendered dynamically by app.js |

### Architecture Notes
- **Auth:** Role-based (Trip Member / Viewer) with shared password `12345`
- **Members:** Philip, Nymph, Teeratat, Nook, Pete, Pun+, Noey, Nott, Teechai, Jam
- **Persistence:** localStorage per member (`bromo_pack_<name>`, `bromo_memo_<name>`, `bromo_session`)
- **Tab loading:** Lazy fetch from `tabs/*.html` — requires local server (Live Server or `python -m http.server`)
- **Memo tab:** Full expense tracking (category, IDR/THB, day) + notes — edit own only, view-only for others

### Asset Files
| File | Type | Purpose |
|---|---|---|
| `Asset/hero-volcano.svg` | SVG illustration | Bromo sunrise panorama — used in Overview hero |
| `Asset/waterfall-element.svg` | SVG illustration | Tumpak Sewu waterfall — used in Spots tab |
| `Asset/bluefire-element.svg` | SVG illustration | Kawah Ijen blue fire — used in Spots tab |
| `Asset/badge-adventure.svg` | SVG illustration | Round adventure badge / sticker |
| `Asset/overview_Pic.png` | Photo | Overview hero photo |
| `Asset/Bromo Mount.png` | Photo | Bromo destination card |
| `Asset/Madakaripura Waterfall.png` | Photo | Madakaripura destination card |
| `Asset/Kapas Biru Waterfall.png` | Photo | Kapas Biru destination card |
| `Asset/Kawah Ijen — Blue Fire.png` | Photo | Ijen destination card |
| `Asset/Teras Semeru Viewpoint.png` | Photo | Teras Semeru destination card |
| `Asset/Tumpak Sewu Waterfall.png` | Photo | Tumpak Sewu destination card |
| `Asset/What to wear Bromo.png` | Photo | Wear tab — Bromo outfit guide |
| `Asset/What to wear Kawah Ijen .png` | Photo | Wear tab — Ijen outfit guide |
| `Asset/What to wear Madakaripura.png` | Photo | Wear tab — Madakaripura outfit guide |
| `Asset/What to wear Teras Semeru Viewpoint.png` | Photo | Wear tab — Teras Semeru outfit guide |
| `Asset/What to wear Tumpak sawu.png` | Photo | Wear tab — Tumpak Sewu outfit guide |
| `Asset/Character.PNG` | Concept art | Reference only — character sheet |
| `Asset/Concept art Animal.PNG` | Concept art | Reference only — animal style infographic |
| `Asset/Concept art Human.PNG.png` | Concept art | Reference only — human style infographic |

> **Generated SVGs** are the preferred artwork — never embed concept art photos directly into pages.

---

## Design System

Matches Pete's portfolio website (`/Users/piman/Desktop/My Career/Update My Career/Portfolio Website/index.html`).

**Color Palette:**
```
--bg:        #F5F8F6   (page background)
--bg-alt:    #EBF1EC   (section alt background)
--bg-dark:   #1A2E2A   (dark sections / heroes)
--primary:   #1D4E5E   (headings, key UI)
--secondary: #2E7D68   (accents, links, active)
--accent:    #5BA08A   (badges, tags, highlights)
--gold:      #C8A850   (must-have items, highlights)
--text:      #1A2B35   (body text)
--muted:     #5A7080   (secondary text)
--border:    #D0E0D8   (dividers, card borders)
--card:      #FFFFFF   (card backgrounds)
```

**Typography:**
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&display=swap" rel="stylesheet">
```
```css
font-family: "Noto Sans Thai", system-ui, sans-serif;
font-optical-sizing: auto;
font-variation-settings: "wdth" 100;
```

**Design Language:** Clean cards, soft shadows (`0 4px 24px rgba(29,78,94,0.08)`), rounded corners (14px), pill-shaped badges, layered silhouette SVG illustrations.

---

## Language & Writing Style

- **Conversation:** Thai is fine
- **Web pages / documents:** Mostly English
- **Writing tone for trip content:** Gen Z travel — casual, honest, punchy. Not promotional. No fluff. ("The bamboo ladder is sketchy. Do it anyway.")
- **Thai labels/tags:** OK for short UI labels if natural

---

## Preferences

- Build HTML files with **tab-based navigation** (separate page feel, not one long scroll)
- Use **generated SVG elements** as artwork — not raw concept art photos
- Keep headers minimal — no unnecessary badges/labels cluttering the top
- Packing list items need **checkbox interaction** built in
- Money section should reflect **10 people, eating well, with personal spending** (~5,000–7,500 THB/person recommended)
- Budget per person: ~3,000 THB baseline, realistically 5,000–7,500 THB with meals + shopping

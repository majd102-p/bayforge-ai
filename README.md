<div align="center">

# 🔨 BayForge AI

### AI-Powered California ADU Zoning Analysis Platform

**Multi-Agent RAG · 58+ Cities · 7 AI Models · 12+ Free APIs · Built with AI**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)](https://ui.shadcn.com/)
[![Built with AI](https://img.shields.io/badge/Built_with-AI_Assistance-8B5CF6?logo=openai)](#how-ai-was-used)
[![MIT License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---
https://bayforge-ai.vercel.app/ 
## ⚠️ Project Status

> **⛔ PROJECT STOPPED — Will NOT continue. Published as-is for reference only.**

| Status | Detail |
|---|---|
| **State** | ⛔ **Stopped** — Development has been discontinued permanently |
| **Continuing?** | ❌ **No** — The project will not be resumed or updated |
| **Purpose** | 📚 Personal educational project to build practical skills |
| **Author** | 🎓 Recent university graduate |
| **AI Help** | 🤖 Built with significant AI assistance (see [How AI Was Used](#how-ai-was-used)) |
| **License** | 📄 MIT — free to use, modify, and learn from |

**What works:**
- ✅ Full UI with 7 interactive tabs and 10+ feature components
- ✅ AI chat with streaming responses and 7 model options
- ✅ 14 API routes with 12+ free external APIs
- ✅ 58+ cities data, 15 ADU companies, legal references
- ✅ Dark theme, responsive design, animations

**What's incomplete:**
- ❌ No real RAG pipeline with ChromaDB vector search
- ❌ No real PDF zoning document corpus (uses AI-generated data)
- ❌ No user authentication or database persistence
- ❌ No deployment pipeline or CI/CD
- ❌ No tests (unit, integration, or E2E)
- ❌ No production-ready error handling
- ❌ Some API routes return mock/fallback data

---

## 📋 Quick Summary

**BayForge AI** is a concept platform that helps California residents navigate **ADU (Accessory Dwelling Unit)** zoning regulations using AI. The idea: ask a question about zoning in any California city, and get an instant answer with legal code references.

> *This project was built by a recent graduate to strengthen full-stack development skills through hands-on project work. It was developed with significant AI assistance and is shared open-source for others to learn from.*

**Key highlights:**
- 🏙️ Covers **58+ California cities** across 4 regions
- 🤖 Integrates **7 AI models** (GPT-4o, Claude, Gemini, DeepSeek, etc.)
- 🔌 Uses **12+ free APIs** with no API keys required
- 📊 Interactive **feasibility scorer**, prefab checker, permit checklist
- 📚 Comprehensive data: 15 ADU companies, 8 prefab manufacturers, 37+ resources

---

## 🤖 How AI Was Used

> I believe in transparency. AI tools significantly accelerated development, but every decision was mine.

| Phase | Human | AI |
|---|---|---|
| **Idea & Concept** | 💡 100% — Original problem identification | — |
| **Architecture** | 🏗️ 80% — Tech stack, structure, features | 🤖 20% — Suggested patterns |
| **Code Writing** | 🧑‍💻 30% — Review, debug, test, decide | 🤖 70% — Generated code, components, APIs |
| **UI/UX** | 🎨 60% — Direction, colors, flow | 🤖 40% — Layout, responsive design |
| **Data & Content** | 📊 50% — Curated, verified | 🤖 50% — Generated, integrated |
| **Documentation** | 📝 40% — Framing, story, disclaimer | 🤖 60% — Structure, formatting |

**Tools used:** Claude (primary), ChatGPT (review), GitHub Copilot (inline suggestions).

**Bottom line:** AI generated code, but I reviewed every line, understood every pattern, and made every architectural decision. Building this taught me more than any tutorial could.

---

## ✨ Features

### Core Tabs

| # | Tab | Description |
|---|---|---|
| 1 | 🤖 **Zoning Expert** | AI chat with 7 models, streaming, multilingual, legal citations |
| 2 | 📊 **Feasibility Scorer** | Input property details → instant feasibility score |
| 3 | 🏠 **Prefab Checker** | Compare 8 prefab ADU manufacturers side-by-side |
| 4 | 🏢 **ADU Companies** | Directory of 15 California ADU companies with filters |
| 5 | 🗺️ **City Coverage** | 58+ cities, 4 regions, search & filter |
| 6 | 📚 **Resources Hub** | 37+ curated links (government, financing, floor plans) |
| 7 | 📋 **Permit Checklist** | 5-phase, 46-item city-specific checklist generator |

### Additional Sections

- ⚖️ **Legal Framework** — CA ADU laws (Gov Code §65852.2, AB 2221, SB 897)
- 🏗️ **Architecture** — Multi-agent system diagram & tech stack visualization
- 📖 **Ordinance Structure** — 12-chapter zoning code breakdown
- 👥 **Hiring Guide** — Checklist for hiring ADU contractors
- 📈 **City Insights** — Per-city data with live API enrichment
- 🤝 **LLM Providers** — Guide to supported AI model providers

---

## 🔌 Free External APIs

All APIs used are **free and require no API keys**:

| API | Purpose |
|---|---|
| **Open-Meteo** | Weather & climate history |
| **Nominatim (OSM)** | Geocoding & city coordinates |
| **Overpass API** | Infrastructure & POI data |
| **US Census Bureau** | Population & demographics |
| **Wikipedia API** | City information |
| **Open Elevation** | Terrain elevation |
| **USGS Earthquake** | Seismic risk data |
| **EPA AirNow** | Air quality index |
| **NREL Solar** | Solar irradiance |
| **Open-Meteo Solar** | Solar energy potential |
| **DuckDuckGo** | Quick info lookup |
| **Wikidata** | Structured data queries |

All calls are proxied through backend routes — no keys exposed to the client.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **State** | Zustand + TanStack Query |
| **Database** | Prisma ORM + SQLite |
| **AI** | z-ai-web-dev-sdk (multi-model) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Theme** | next-themes (dark/light) |

---

## 📁 Project Structure

```
bayforge-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main page (all sections)
│   │   ├── layout.tsx                  # Root layout + providers
│   │   ├── globals.css                 # Theme variables
│   │   └── api/                        # 14 API routes
│   │       ├── chat/                   # AI chat (streaming)
│   │       ├── geocode/                # City geocoding
│   │       ├── weather/                # Weather data
│   │       ├── census/                 # Census demographics
│   │       ├── city-info/              # Combined city data
│   │       ├── elevation/              # Terrain elevation
│   │       ├── seismic/                # Earthquake risk
│   │       ├── air-quality/            # Air quality index
│   │       ├── solar/                  # Solar irradiance
│   │       ├── transit/                # Public transit
│   │       ├── infrastructure/         # OSM infrastructure
│   │       └── housing-data/           # Housing statistics
│   ├── components/
│   │   ├── bayforge/                   # 10 feature components
│   │   └── ui/                         # shadcn/ui components
│   ├── store/
│   │   └── ai-store.ts                 # Zustand state
│   └── lib/
│       ├── db.ts                       # Prisma client
│       └── utils.ts                    # Utilities
├── prisma/schema.prisma
├── LICENSE
├── README.md
└── package.json
```

---

## 🚀 Getting Started

```bash
# 1. Clone
git clone https://github.com/majdayoub/bayforge-ai.git
cd bayforge-ai

# 2. Install
bun install

# 3. Database
bun run db:push

# 4. Run
bun run dev
```

Open `http://localhost:3000` in your browser.

**Requirements:** Node.js 18+ or Bun 1.0+

---

## 🏙️ Covered Cities

| Region | Cities | Count |
|---|---|---|
| **Bay Area** | SF, San Jose, Oakland, Fremont, Palo Alto, Berkeley, Mountain View, Cupertino, San Mateo, Santa Clara, Napa, Santa Rosa, and more | 28 |
| **Southern CA** | LA, San Diego, Long Beach, Anaheim, Irvine, Pasadena, Burbank, Glendale, Huntington Beach, Carlsbad, and more | 21 |
| **Central Valley** | Sacramento, Fresno, Bakersfield, Stockton, Modesto, Visalia, Clovis | 7 |
| **Inland Empire** | Riverside, San Bernardino, Ontario, Rancho Cucamonga | 4 |

**Total: 58+ cities**

---

## ⚖️ Legal Disclaimer

> **THIS IS A CONCEPT/EDUCATIONAL PROJECT ONLY — NOT FOR REAL USE.**

- ❌ NOT a commercial product or professional service
- ❌ NOT a substitute for licensed professional advice
- ❌ NOT guaranteed to be accurate or up-to-date
- ❌ NO WARRANTY of any kind
- ❌ NO LIABILITY for any damages

**Always consult** your city planning department, a licensed architect, and a real estate attorney for actual ADU decisions.

---

## 👤 About the Author

<div align="center">

**Majd Ayoub**
Recent Graduate 

[![LinkedIn](https://img.shields.io/badge/LinkedIn-majd--ayoub-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/majd--ayoub)

</div>

### My Story

After graduating, I wanted to bridge the gap between academic knowledge and real-world skills. So I started building **comprehensive projects** across different domains — not just following tutorials, but solving real problems.

**Skills I developed through this project:**

- **Full-stack development** — Next.js, React, TypeScript, APIs, database
- **AI integration** — LLM chat, streaming, prompt engineering, multi-model
- **API consumption** — 12+ free APIs, backend proxying, data transformation
- **UI/UX** — Responsive design, dark themes, animations, accessibility
- **Architecture** — Modular components, state management, API design
- **AI-assisted development** — Using AI as a force multiplier, not a crutch

This is one of several projects I built to strengthen different skill areas. Each project focuses on different technologies and problem domains.

> I have since moved on to other projects and will not be continuing development on BayForge AI.

### Why Open Source?

1. **Learn from it** — The code patterns might help someone else
2. **Build on it** — Solid foundation if anyone wants to continue the concept
3. **Transparency** — Limitations and AI usage are honestly documented
4. **Portfolio** — Demonstrates practical skills to potential employers

---

## 🤝 Contributing

> **Note:** The original author has **stopped working on this project** and will not continue it.
>
> However, the code is MIT-licensed, so anyone is free to fork it and continue development.

**Ideas if you want to continue:**
- Add real RAG pipeline with ChromaDB vector search
- Add unit and integration tests
- Deploy to Vercel/Netlify
- Add user authentication and database persistence
- Add more cities and real zoning document corpus

---

## 📄 License

[MIT](LICENSE) — Copyright (c) 2025 Majd Ayoub. Free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ and 🤖 AI assistance**

⭐ Star this repo if it helped you learn something!

[LinkedIn](https://www.linkedin.com/in/majd--ayoub) · 

---

⚠️ *Stopped project. Educational reference only. Not for real use.*

</div>

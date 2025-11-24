# 🌍 EcoChronos — Guardians of the Earth
*A mythology-powered eco-adventure that transforms awareness into real-world action*

---
The game blends:
- Mythology  
- Science  
- Environmental activism  
- Gamification  
- Real-world challenges  
- Optional on-chain verification

## 📌 Overview
EcoChronos is an innovative, mythology-inspired environmental game and learning platform that blends story, science, and community action.  
Players restore ecosystems, fight corruption, learn through an integrated knowledge hub, and complete real-world missions verified through the platform.  

- **Core idea:** Myth-driven quests teach environmental systems and trigger real-world conservation actions.  
- **Audience:** Students, youth activists, gamers, environmental clubs, teachers, and NGOs.  
- **Outcomes:** Environmental literacy, measurable actions, and community engagement supported by a reward loop.  

---

## 🚩 Problem Statement
Awareness alone doesn’t change behavior — people need emotional engagement, a clear path to action, and feedback.  

- **Disconnection:** People feel removed from nature and don’t see personal impact.  
- **Motivation:** Sustainable actions have weak incentives.  
- **Data gaps:** Localized, real-time insights are scarce for NGOs and schools.  
- **Consequence:** Conservation campaigns underperform; learning doesn’t translate to action.  
- **EcoChronos solution:** Turn learning into play, play into action, and action into measurable impact.  

---

## 💡 Vision and Mission
- **Vision:** To make saving the Earth as engaging as saving the world in a game.  
- **Mission:** Blend mythological storytelling with science-driven gameplay and a proof-of-action system that educates, motivates, and rewards community-led conservation.  

---

## 🎮 Core Gameplay
- **Quests from Nature Gods:** Gaia (forests), Poseidon (oceans), Artemis (wildlife), Aeolus (air), Helios (climate).  
- **Combat and challenges:** Face Smog Serpents, Plastic Phantoms, Oil Shadows, and Deforestation Demons.  
- **Restoration puzzles:** Regrow forests, purify rivers, balance climate tiles, restore biodiversity.  
- **Chronos Time System:** World shifts between the *Era of Restoration* and *Era of Decline* based on player actions.  

---

## 🛠 Key Systems
- **EcoChronos Timeline Engine:** Visualizes deterioration/restoration in real time.  
- **Micro-Learning Hub:** Bite-sized lessons, videos, and actionable real-world tasks.  
- **Proof-of-Action Missions:** Players plant trees, clean waste, recycle, and upload photo/location proof.  
- **Reward System:** XP, badges, titles, cosmetics, optional on-chain Proof-of-Action tokens.  
- **CTA System:** Connects players to conservation courses, NGO challenges, and tree-planting programs.  

---

## 🔧 Tech Stack
- **Frontend:** Unity (WebGL & PC), React dashboard.  
- **Backend:** Supabase (auth, database, file storage, analytics).  
- **Optional Integrations:** UNEP datasets, GBM data, climate/forest GIS layers, blockchain (Polygon, Celo, Base).  
- **Code:** Detailed implementation is documented separately in frontend/backend READMEs.  

---

## 🏗 Architecture (High-Level)
- **Client Layer (Unity):** Player movement, UI, missions, learning hub.  
- **API Layer (Supabase Functions):** Handles logic for XP, inventory, rewards, analytics.  
- **Database Layer (Postgres):** Stores players, missions, progress, inventory, learning hub engagement, actions performed.  
- **Content System:** JSON-based mission definitions, dynamic environment tile loading.  
- **Security:** Auth via Supabase, role-based permissions, safe proof uploads.  

---

## 🧱 MVP Scope
- **Cinematic Intro:** 3D animated sequence showing decline and rise of Eco-Gods.  
- **Accounts:** Email/password + Google login; sync progress across devices.  
- **Core Gameplay (2.5D):** Base sanctuary, corruption zones, missions (pollution removal, wildlife rescue, tree/reef restoration).  
- **Learning Hub:** Neutral zone with five sections (forests, oceans, climate, urban waste, biodiversity).  
- **Backend:** Player profiles, mission states, progress tracking, inventory, skill trees, learning analytics, leaderboards (optional).  

---

## 📚 Learning Hub
- **Purpose:** Translate game concepts into real environmental knowledge.  
- **Impact:** Builds literacy, encourages real-life actions, creates feedback loop (learn → apply in game → act outside).  
- **Integration:** Lessons grant XP/abilities, missions require knowledge, real-world actions unlock unique items.  

---

## 🚀 Roadmap
- **MVP:** Single biome, intro cinematic, base missions, Learning Hub v1, proof uploads, basic rewards.  
- **Post-MVP:**  
  - Multiplayer: Co-op missions, shared restoration zones, leaderboards.  
  - Blockchain (optional): Eco-credits, player-owned cosmetics, immutable mission logs.  
  - New zones: Desertification, glacier collapse, coral reef revival.  
  - Community events: Weekend challenges, global restoration campaigns.  
  - Data: Partner APIs, citizen-science dashboards, advanced verification.  

---

## 📂 Repository Structure

---

## 🧑‍🤝‍🧑 Team Roles
- **Game Designer:** Mechanics, missions, systems.  
- **Unity Developer:** Gameplay, UI, environments.  
- **Backend Engineer:** Supabase functions & schemas.  
- **2D/3D Artists:** Assets, animations, cinematic intro.  
- **Content Writer:** Learning hub lessons and narratives.  
- **Environmental Researcher:** Scientific accuracy and references.  
- **Partnerships Lead:** NGO/community integrations and events.  

---

## 🎯 Deliverables
- 📑 [Pitch Deck](./pitch-deck.pdf)  
- 🎥 Demo Video (2–3 min): *link here*  
- 💻 [Frontend Guide](./frontend-unity/README.md)  
- ⚙️ [Backend Guide](./backend-supabase/README.md)  
- 📚 [Documentation](./docs/README.md)  

---

## 📜 License
This project is licensed under the MIT License. See `LICENSE` for details.  

---

## 🙏 Acknowledgements
- Mythological inspiration: Gaia, Poseidon, Artemis, Aeolus, Helios.  
- Environmental context: WMF, GBM, UNEP, WWF datasets.  
- Tools: Unity, Supabase/Firebase, open educational resources.  

---

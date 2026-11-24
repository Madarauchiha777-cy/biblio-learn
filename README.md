# BiblioLearn — The Signature 3D University Library & E-Learning Archive

[![Django](https://img.shields.io/badge/Django-5.2.19-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Campus](https://img.shields.io/badge/Campus-ESMA%20Marrakech-B78B55?style=for-the-badge)](https://esma.ac.ma)

**BiblioLearn** is a flagship academic platform engineered for **ESMA Marrakech** (*École Supérieure de Management & d'Architecture*). It merges an **immersive 3D virtual university library** powered by Three.js and a digital librarian character (**BIBI**), a live catalog with loan circulation governance, faculty-led video masterclasses, and an isolated staff command dashboard.

---

## 🏛️ Creative Vision & Art Direction

- **Visual Identity**: Editorial Academic, Architectural Precision, and subtle Moroccan heritage inspired by Marrakech.
- **Palette**:
  - `Midnight Ink`: `#111827` (Deep Obsidian archival base)
  - `Warm Paper`: `#EAE7DF` (Academic parchment tone)
  - `Academic Blue`: `#315C9B` (Curricular primary)
  - `Muted Bronze`: `#B78B55` (Embossed foil accents)
  - `Sage Green`: `#78917D` (Catalog availability & status)
- **Typography**:
  - Headings: *Cormorant Garamond* (Editorial display serif)
  - UI Elements: *Plus Jakarta Sans* (Contemporary sans-serif)
  - Accession & ISBN Metadata: *JetBrains Mono* (Technical monospace)
- **Dual-Mode System**: Seamless switching between **Obsidian Ink** (Dark) and **Warm Paper** (Light) with persistent `localStorage` preference and zero flash of unstyled content.

---

## 🌟 Flagship Features

### 1. 🌐 Immersive 3D University Library (`/virtual-library/`)
- **Architectural Interior**: Real-time WebGL grand reading hall modeled on classical Moroccan academic architecture with cedar parquet flooring, brass zellige grid inlays, vaulted timber coffer ceilings, arched embrasures, and volumetric daylight shafts.
- **BIBI The Digital Librarian**:
  - Fully articulated 3D humanoid character engine built in Three.js.
  - **Mouse Gaze Tracking**: Head and eye pupils naturally track the visitor's cursor with smooth interpolation.
  - **Idle Kinematics**: Periodic natural eyelid blinking, chest breathing expansion, and scholar posture sways.
  - **Pathfinding Walk Cycles**: Smooth inverse-pendulum locomotion across the library floor.
  - **Book Retrieval Choreography**: When a visitor clicks a book, BIBI announces the action, walks to the shelf, reaches out, takes the book from its slot, and presents it to the camera with speech feedback.
  - **Shelf Restocking**: Smoothly returns books back into their original shelf positions.
- **Physical Bookshelves & Dynamic Django Integration**:
  - Physical multi-tier bookshelves categorized by academic disciplines (*Informatique & Web*, *Intelligence Artificielle*, *Design & Multimédia*, *Management & Gestion*, *Marketing & Communication*).
  - Queries live records via `/api/library-3d/` — books added in Django automatically appear on the 3D shelves!
  - Individual physical books with dynamic HTML5 canvas spine textures (gold lettering, title, call number), front cover textures, and realistic organic arrangement (vertical, leaning, stacked).
- **Interactive HUD & Camera Bookmarks**:
  - One-click spatial rail: *Grand Hall View*, *Meet BIBI*, *CS Stacks*, *AI Alcove*, *Design Wing*, *Management Archive*.
  - Real-time 3D search: typing pulses matching books with a golden glow and dims non-matches.
  - Procedural Web Audio API soundscape (gentle tape air, page turns, acoustic chime — zero external MP3 dependencies).
  - Archival Book Folio Drawer with 14-day circulation loan requests.

### 2. 📚 Books & Academic Archive (`/livres/`)
- Standard 2D archival view with call numbers (`ESMA-ARCH-000X`), simulated book spine bindings, multi-attribute filtering (keywords, major, availability, sorting), and folio detail modals.
- Instant 1-click ISBN clipboard copy, stacks availability indicators, and faculty rating stamps.

### 3. 🎓 Faculty Masterclasses & Video Syllabi (`/mini-cours/`)
- Academic video capsules with curriculum breakdown, syllabus milestones, estimated duration, difficulty levels, and instructor accreditation stamps.

### 4. 🏛️ The 4 Institutional Pillars (`/modules/`)
- **Module 01**: Catalog & Academic Collections (Smart indexing & full-text discovery).
- **Module 02**: User Accounts & Role Governance (Granular RBAC matrix for Students, Faculty, Librarians, Admins).
- **Module 03**: Loan Circulation & Due Date Alerts (14-day borrowing lifecycle and automated notifications).
- **Module 04**: Mini-Courses & Self-Paced Learning.

### 5. 🛡️ Staff Command Console (`/dashboard-admin/`)
- Private administration suite protected by `@staff_member_required`.
- Editorial KPI cards, fast book/course registration with image file upload support via Pillow, and instant 1-click availability toggle buttons.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, Django 5.2.19
- **3D Engine**: Three.js (r128), OrbitControls, Tween.js, Web Audio API
- **Frontend**: Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Vanilla JavaScript
- **Database**: SQLite
- **Media**: Pillow (PIL)
- **Typography**: Cormorant Garamond, Plus Jakarta Sans, JetBrains Mono

---

## 🚀 Quickstart & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Madarauchiha777-cy/biblio-learn.git
cd biblio-learn
```

### 2. Activate Virtual Environment
```powershell
# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations & Verify Database
```bash
python manage.py migrate
python manage.py check
```

### 5. Start Development Server
```bash
python manage.py runserver
```

Open your browser at **`http://127.0.0.1:8000/`**.
To experience the 3D Library, click **"3D Library"** in the top navigation or navigate directly to **`http://127.0.0.1:8000/virtual-library/`**.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/library-3d/` | Returns JSON of all books grouped by category for Three.js scene |
| `POST` | `/api/livres/<id>/emprunter/` | Signs out a book under 14-day archival loan |
| `POST` | `/api/livres/<id>/retourner/` | Returns a book back to central stacks |

---

&copy; 2026 BiblioLearn &bull; ESMA Marrakech. All rights reserved.

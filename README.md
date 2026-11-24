# BiblioLearn — University Library & E-Learning Platform

[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/Campus-ESMA%20Marrakech-4f46e5?style=for-the-badge)](https://esma.ac.ma)

**BiblioLearn** is a modern, responsive university platform developed for **ESMA Marrakech**. It combines a centralized academic library catalog, loan circulation tracking, interactive faculty-led mini-courses, and a dedicated staff administration dashboard.

---

## 🌟 Key Features

### 1. 📚 Books & Academic Catalog (`/livres/`)
- Responsive Bootstrap 5.3 card grid with instant live search and multi-criteria filters (keywords, academic major, publication year, availability in stacks).
- Dynamic cover images with file upload support (`ImageField` via Pillow) and SVG gradient fallbacks.
- Comprehensive modal details (ISBN code with 1-click clipboard copy, shelf location, loan quotas, loan renewal policy).
- Desk reservation simulation with live Bootstrap Toast notifications.

### 2. 🎓 E-Learning & Mini-Courses (`/mini-cours/`)
- Interactive video capsules created by university faculty.
- Categorization by academic domain (Web Dev, AI, Design, Management) and skill levels (Beginner, Intermediate, Advanced).
- Course details modal with syllabus breakdown, duration, and lesson indicators.

### 3. 🏛️ The 4 Functional Modules (`/modules/`)
- **Module 1**: Catalog & Academic Collections (Smart indexing & discovery).
- **Module 2**: Accounts & Granular Role Governance (RBAC matrix for students, instructors, librarians, and admins).
- **Module 3**: Loan Circulation & Due Date Alerts (Borrowing lifecycle and policies).
- **Module 4**: Mini-Courses & Self-Paced Learning.

### 4. 🛡️ Dedicated Staff Admin Console (`/dashboard-admin/`)
- Completely isolated from public student views; protected by `@staff_member_required`.
- At-a-glance KPI metrics (Total Titles, In Stacks, On Loan, Mini-Courses).
- Real-time catalog inventory management with **1-click availability toggling**.
- Fast creation modals for new books and mini-courses with custom image uploads.
- Direct links to the native Django Superuser Admin (`/admin/`).

### 5. 🎨 "Cyber-Sapphire & Lumina Aurora" Dual-Mode Theme
- **Fully Flexible**: Seamlessly toggle between **Dark Mode** (Obsidian Indigo `#0a0f1d`), **Light Mode** (Arctic Crystal `#f8fafc`), or **Auto** (system preference).
- Persistent preference saved in `localStorage` with zero flicker on page load.
- Modern Bootstrap 5.3 breadcrumbs, pills, tooltips, responsive modals, and glassmorphic elevations.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, Django 5.2.19
- **Frontend**: Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Vanilla JavaScript
- **Database**: SQLite
- **Media & Images**: Pillow (PIL)
- **Typography**: Space Grotesk (Headings), Plus Jakarta Sans (Body)

---

## 🚀 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Madarauchiha777-cy/biblio-learn.git
cd biblio-learn
```

### 2. Create and activate a virtual environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run database migrations
```bash
python manage.py migrate
```

### 5. Create a Superuser / Admin account (Optional)
```bash
python manage.py createsuperuser
```

### 6. Start the development server
```bash
python manage.py runserver
```

Open your browser at **`http://127.0.0.1:8000/`**.

---

## 📂 Project Structure

```
biblio_learn/
│
├── config/                  # Django project settings & root URLs
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── pages/                   # Main application
│   ├── models.py            # Livre & MiniCours models
│   ├── views.py             # Student views & staff admin dashboard
│   ├── urls.py              # URL routing
│   ├── admin.py             # Native Django admin configuration
│   └── templates/pages/     # HTML templates (accueil, livres, modules, mini_cours, dashboard_admin)
│
├── templates/               # Global templates
│   └── base.html            # Core layout with theme switcher & responsive navbar
│
├── static/                  # Static assets
│   ├── css/bibliolearn.css  # Dual-mode Cyber-Sapphire theme styles
│   └── js/bibliolearn.js    # Theme engine, toasts, & tooltips
│
├── media/                   # User-uploaded media (book & course covers)
│   └── livres/
│
├── manage.py
├── requirements.txt
└── README.md
```

---

## 👥 Authors & Academic Attribution

Developed for **ESMA Marrakech** (École Supérieure de Management & d'Architecture).  
Academic Year 2026-2027.

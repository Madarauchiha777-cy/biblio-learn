from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Livre, Categorie, MiniCours, CategorieCours, NiveauCours


def accueil(request):
    livres = Livre.objects.all()
    cours = MiniCours.objects.all()
    total_livres = livres.count()
    total_disponibles = livres.filter(disponible=True).count()
    total_cours = cours.count()

    # Top-rated available books for showcase
    featured_livres = livres.filter(disponible=True).order_by("-note", "-date_ajout")[:6]
    if not featured_livres.exists():
        featured_livres = livres[:6]

    # Popular e-learning courses
    popular_cours = cours.filter(populaire=True)[:3]
    if not popular_cours.exists():
        popular_cours = cours[:3]

    modules = [
        {
            "id": "catalogue",
            "nom": "Books & Document Catalog",
            "description": "Explore and search through our collection of physical books, digital references, academic theses, and research papers.",
            "icone": "bi-journal-bookmark-fill",
            "color": "emerald",
            "badge": "Library",
            "action": "Browse Books",
            "url": "/livres/",
            "image": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80",
        },
        {
            "id": "comptes",
            "nom": "Accounts & Role Governance",
            "description": "Tailored workspaces with differentiated permissions for students, faculty members, librarians, and administrators.",
            "icone": "bi-shield-lock-fill",
            "color": "teal",
            "badge": "Governance & RBAC",
            "action": "Member Space",
            "url": "/modules/",
            "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
        },
        {
            "id": "emprunts",
            "nom": "Loan Circulation & Alerts",
            "description": "Streamlined book circulation management, real-time availability tracking, due-date reminders, and online renewals.",
            "icone": "bi-arrow-left-right",
            "color": "amber",
            "badge": "Circulation",
            "action": "Borrowing Guide",
            "url": "/modules/",
            "image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
        },
        {
            "id": "minicours",
            "nom": "Online Mini-Courses",
            "description": "Self-paced interactive video capsules and masterclasses designed to accelerate academic research and professional skills.",
            "icone": "bi-mortarboard-fill",
            "color": "forest",
            "badge": "E-Learning",
            "action": "Explore Courses",
            "url": "/mini-cours/",
            "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
        },
    ]

    stats = [
        {"valeur": f"{total_livres} Books", "label": "Titles in Library", "icone": "bi-book-half"},
        {"valeur": f"{total_disponibles} Available", "label": "Ready to Borrow", "icone": "bi-check-circle-fill"},
        {"valeur": f"{total_cours} Courses", "label": "Online Mini-Courses", "icone": "bi-play-btn-fill"},
        {"valeur": "ESMA", "label": "Marrakech Campus", "icone": "bi-mortarboard-fill"},
    ]

    categories = [cat.value for cat in Categorie]

    contexte = {
        "nom_projet": "BiblioLearn",
        "modules": modules,
        "stats": stats,
        "livres": featured_livres,
        "cours": popular_cours,
        "categories": categories,
    }
    return render(request, "pages/accueil.html", contexte)


def liste_livres(request):
    query = request.GET.get("q", "").strip()
    selected_cat = request.GET.get("categorie", "")
    dispo_only = request.GET.get("disponible", "")
    sort = request.GET.get("sort", "recent")

    livres = Livre.objects.all()

    if query:
        livres = livres.filter(
            Q(titre__icontains=query) |
            Q(auteur__icontains=query) |
            Q(isbn__icontains=query) |
            Q(description__icontains=query)
        )

    if selected_cat:
        livres = livres.filter(categorie=selected_cat)

    if dispo_only == "1":
        livres = livres.filter(disponible=True)

    # Sorting options
    if sort == "titre":
        livres = livres.order_by("titre")
    elif sort == "note":
        livres = livres.order_by("-note")
    elif sort == "annee":
        livres = livres.order_by("-annee_publication")
    elif sort == "stock":
        livres = livres.order_by("-nombre_exemplaires")
    else:
        livres = livres.order_by("-date_ajout")

    total_count = livres.count()

    # Pagination: 6 books per page
    paginator = Paginator(livres, 6)
    page_number = request.GET.get("page")
    try:
        page_obj = paginator.get_page(page_number)
    except (PageNotAnInteger, EmptyPage):
        page_obj = paginator.get_page(1)

    categories = [cat.value for cat in Categorie]

    contexte = {
        "nom_projet": "BiblioLearn",
        "livres": page_obj,
        "page_obj": page_obj,
        "categories": categories,
        "selected_cat": selected_cat,
        "query": query,
        "dispo_only": dispo_only,
        "sort": sort,
        "total_count": total_count,
    }
    return render(request, "pages/livres.html", contexte)


def liste_modules(request):
    modules_detail = [
        {
            "id": "catalogue",
            "nom": "Module 1 : Catalog & Library Collections",
            "tagline": "Cataloging, smart search, and instant discovery of physical and digital academic resources.",
            "icone": "bi-journal-bookmark-fill",
            "couleur": "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            "image": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=80",
            "badge": "Search & Indexing",
            "fonctionnalites": [
                "Full-text search & filters (Title, Author, ISBN, Academic Major)",
                "Real-time availability status and exact inventory copy count",
                "Departmental categorization: Computer Science, Management, Design, AI, Marketing",
                "Detailed modal specification with shelf location and maximum loan duration",
            ],
            "public_cible": "Students, Researchers, Faculty Members, and Academic Staff",
            "lien_action": "/livres/",
            "texte_action": "Browse Library Catalog",
        },
        {
            "id": "comptes",
            "nom": "Module 2 : User Accounts & Role Governance",
            "tagline": "Secure authentication and granular access controls aligned with academic status.",
            "icone": "bi-shield-lock-fill",
            "couleur": "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
            "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80",
            "badge": "Security & RBAC",
            "fonctionnalites": [
                "Student Profile: Search catalog, borrow up to 3 books, track e-learning progress",
                "Faculty Profile: Priority reservations for curriculum and course materials",
                "Librarian Profile: Check-in/check-out desk registration and stock governance",
                "Admin Profile: Full Django superuser governance over campus resources",
            ],
            "public_cible": "Entire ESMA Marrakech University Community",
            "lien_action": "#permissions",
            "texte_action": "View Roles Matrix",
        },
        {
            "id": "emprunts",
            "nom": "Module 3 : Loan Circulation & Reminders",
            "tagline": "End-to-end lifecycle management of physical book loans with automated return alerts.",
            "icone": "bi-arrow-left-right",
            "couleur": "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
            "image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=700&q=80",
            "badge": "Circulation",
            "fonctionnalites": [
                "Standard 14-day loan policy with one-click online renewal",
                "Comprehensive loan history for ongoing and past loans",
                "Automated reminders and notifications before due dates",
                "Hold & reservation management for currently checked-out titles",
            ],
            "public_cible": "Registered Library Members and Circulation Desk Officers",
            "lien_action": "/livres/",
            "texte_action": "Check Book Availability",
        },
        {
            "id": "minicours",
            "nom": "Module 4 : Mini-Courses & Self-Learning",
            "tagline": "Targeted e-learning capsules designed to empower student academic and professional achievement.",
            "icone": "bi-mortarboard-fill",
            "couleur": "linear-gradient(135deg, #047857 0%, #0d9488 100%)",
            "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80",
            "badge": "E-Learning",
            "fonctionnalites": [
                "Bite-sized courses ranging from 30 min to 2 hours on key competencies",
                "Academic methodology: thesis writing, research sources, literature review",
                "Technical mastery: modern Python, Django 5, UI/UX with Figma",
                "Self-assessment interactive quizzes to validate learning milestones",
            ],
            "public_cible": "Students Across All Degrees and Academic Majors",
            "lien_action": "/mini-cours/",
            "texte_action": "Explore Mini-Courses",
        },
    ]

    contexte = {
        "nom_projet": "BiblioLearn",
        "modules_detail": modules_detail,
    }
    return render(request, "pages/modules.html", contexte)


def liste_mini_cours(request):
    query = request.GET.get("q", "").strip()
    selected_cat = request.GET.get("categorie", "")
    selected_niveau = request.GET.get("niveau", "")
    sort = request.GET.get("sort", "populaire")

    cours = MiniCours.objects.all()

    if query:
        cours = cours.filter(
            Q(titre__icontains=query) |
            Q(formateur__icontains=query) |
            Q(description__icontains=query)
        )

    if selected_cat:
        cours = cours.filter(categorie=selected_cat)

    if selected_niveau:
        cours = cours.filter(niveau=selected_niveau)

    # Sorting
    if sort == "recent":
        cours = cours.order_by("-date_ajout")
    elif sort == "titre":
        cours = cours.order_by("titre")
    elif sort == "lecons":
        cours = cours.order_by("-nombre_lecons")
    else:
        cours = cours.order_by("-populaire", "-date_ajout")

    total_cours = cours.count()

    # Pagination: 6 courses per page
    paginator = Paginator(cours, 6)
    page_number = request.GET.get("page")
    try:
        page_obj = paginator.get_page(page_number)
    except (PageNotAnInteger, EmptyPage):
        page_obj = paginator.get_page(1)

    categories = [cat.value for cat in CategorieCours]
    niveaux = [niv.value for niv in NiveauCours]

    contexte = {
        "nom_projet": "BiblioLearn",
        "cours": page_obj,
        "page_obj": page_obj,
        "categories": categories,
        "niveaux": niveaux,
        "selected_cat": selected_cat,
        "selected_niveau": selected_niveau,
        "query": query,
        "sort": sort,
        "total_cours": total_cours,
    }
    return render(request, "pages/mini_cours.html", contexte)


# ==============================================================================
# Dedicated Custom Admin Dashboard Views (Restricted to Staff / Librarians)
# ==============================================================================

@staff_member_required(login_url="/admin/login/")
def dashboard_admin(request):
    """
    Dedicated private administration workspace for librarians and faculty managers.
    Separated from the public student site.
    """
    search_q = request.GET.get("q", "").strip()
    active_tab = request.GET.get("tab", "livres")

    livres = Livre.objects.all().order_by("-date_ajout")
    if search_q and active_tab == "livres":
        livres = livres.filter(
            Q(titre__icontains=search_q) |
            Q(auteur__icontains=search_q) |
            Q(isbn__icontains=search_q)
        )

    cours = MiniCours.objects.all().order_by("-date_ajout")
    if search_q and active_tab == "cours":
        cours = cours.filter(
            Q(titre__icontains=search_q) |
            Q(formateur__icontains=search_q)
        )

    total_livres = Livre.objects.count()
    total_disponibles = Livre.objects.filter(disponible=True).count()
    total_pretes = total_livres - total_disponibles
    total_cours = MiniCours.objects.count()
    cours_populaires = MiniCours.objects.filter(populaire=True).count()

    categories_livres = [c.value for c in Categorie]
    categories_cours = [c.value for c in CategorieCours]
    niveaux_cours = [n.value for n in NiveauCours]

    contexte = {
        "nom_projet": "BiblioLearn",
        "livres": livres,
        "cours": cours,
        "total_livres": total_livres,
        "total_disponibles": total_disponibles,
        "total_pretes": total_pretes,
        "total_cours": total_cours,
        "cours_populaires": cours_populaires,
        "categories_livres": categories_livres,
        "categories_cours": categories_cours,
        "niveaux_cours": niveaux_cours,
        "search_q": search_q,
        "active_tab": active_tab,
    }
    return render(request, "pages/dashboard_admin.html", contexte)


@staff_member_required(login_url="/admin/login/")
def ajouter_livre_admin(request):
    """
    Quickly add a book from the admin dashboard with optional cover image upload.
    """
    if request.method == "POST":
        titre = request.POST.get("titre", "").strip()
        auteur = request.POST.get("auteur", "").strip()
        categorie = request.POST.get("categorie", Categorie.INFORMATIQUE.value)
        isbn = request.POST.get("isbn", "").strip()
        annee = request.POST.get("annee_publication", "2026")
        exemplaires = request.POST.get("nombre_exemplaires", "3")
        description = request.POST.get("description", "").strip()
        note = request.POST.get("note", "4.5")
        disponible = request.POST.get("disponible") == "on"
        image_file = request.FILES.get("image")

        try:
            annee = int(annee)
        except ValueError:
            annee = 2026

        try:
            exemplaires = int(exemplaires)
        except ValueError:
            exemplaires = 3

        try:
            note = float(note)
        except ValueError:
            note = 4.5

        if titre and auteur:
            livre = Livre(
                titre=titre,
                auteur=auteur,
                categorie=categorie,
                isbn=isbn or "978-0-000-00000-0",
                annee_publication=annee,
                nombre_exemplaires=exemplaires,
                description=description,
                note=note,
                disponible=disponible,
                couleur_couverture="#059669",
            )
            if image_file:
                livre.image = image_file
            livre.save()
            messages.success(request, f"Book '{livre.titre}' was successfully added to the catalog.")
        else:
            messages.error(request, "Title and Author are required fields.")

    return redirect("pages:dashboard_admin")


@staff_member_required(login_url="/admin/login/")
def toggle_dispo_livre(request, livre_id):
    """
    Instantly toggle availability of a book from the admin dashboard.
    """
    livre = get_object_or_404(Livre, id=livre_id)
    livre.disponible = not livre.disponible
    livre.save()
    status_label = "Available" if livre.disponible else "Checked Out"
    messages.info(request, f"Status of '{livre.titre}' updated to {status_label}.")
    return redirect("pages:dashboard_admin")


@staff_member_required(login_url="/admin/login/")
def ajouter_cours_admin(request):
    """
    Add a new mini-course from the admin dashboard with optional cover image upload.
    """
    if request.method == "POST":
        titre = request.POST.get("titre", "").strip()
        formateur = request.POST.get("formateur", "").strip()
        categorie = request.POST.get("categorie", CategorieCours.DEVELOPPEMENT.value)
        niveau = request.POST.get("niveau", NiveauCours.DEBUTANT.value)
        duree = request.POST.get("duree_minutes", "60")
        lecons = request.POST.get("nombre_lecons", "5")
        description = request.POST.get("description", "").strip()
        populaire = request.POST.get("populaire") == "on"
        image_file = request.FILES.get("image")

        try:
            duree = int(duree)
        except ValueError:
            duree = 60

        try:
            lecons = int(lecons)
        except ValueError:
            lecons = 5

        if titre and formateur:
            cours = MiniCours(
                titre=titre,
                formateur=formateur,
                categorie=categorie,
                niveau=niveau,
                duree_minutes=duree,
                nombre_lecons=lecons,
                description=description,
                populaire=populaire,
            )
            if image_file:
                cours.image = image_file
            cours.save()
            messages.success(request, f"Course '{cours.titre}' was successfully published.")
        else:
            messages.error(request, "Course title and instructor are required.")

    return redirect("/dashboard-admin/?tab=cours")


# ==============================================================================
# 3D IMMERSIVE UNIVERSITY LIBRARY & BIBI DIGITAL LIBRARIAN ENDPOINTS
# ==============================================================================

def bibliotheque_3d(request):
    """
    Renders the flagship 3D University Library experience for ESMA Marrakech.
    Features the interactive Three.js architectural hall and BIBI the digital librarian.
    """
    livres = Livre.objects.all().order_by("-date_ajout")
    categories = [cat.value for cat in Categorie]
    total_livres = livres.count()
    total_disponibles = livres.filter(disponible=True).count()

    contexte = {
        "nom_projet": "BiblioLearn",
        "categories": categories,
        "total_livres": total_livres,
        "total_disponibles": total_disponibles,
        "livres": livres,
    }
    return render(request, "pages/bibliotheque_3d.html", contexte)


def api_library_3d(request):
    """
    REST JSON endpoint providing real-time catalog records to the Three.js scene.
    Each book is populated onto its corresponding physical academic shelf.
    """
    livres = Livre.objects.all().order_by("categorie", "titre")

    books_data = []
    for livre in livres:
        books_data.append({
            "id": livre.id,
            "titre": livre.titre,
            "auteur": livre.auteur,
            "categorie": livre.categorie,
            "isbn": livre.isbn or f"ESMA-ARCH-{livre.id:04d}",
            "annee": livre.annee_publication,
            "description": livre.description or "Official academic monograph cataloged in ESMA Marrakech central holdings.",
            "exemplaires": livre.nombre_exemplaires,
            "disponible": livre.disponible,
            "note": float(livre.note) if livre.note else 4.8,
            "cover_url": livre.cover_url or "",
            "couleur": livre.couleur_couverture or "#315C9B",
            "icone": livre.icone or "bi-book",
        })

    categories_list = [cat.value for cat in Categorie]

    return JsonResponse({
        "success": True,
        "total": len(books_data),
        "available_count": sum(1 for b in books_data if b["disponible"]),
        "categories": categories_list,
        "books": books_data,
    })


@require_http_methods(["POST"])
def api_emprunter_livre(request, livre_id):
    """
    Registers an archival loan request for a book directly from the 3D interaction.
    """
    livre = get_object_or_404(Livre, id=livre_id)
    if not livre.disponible:
        return JsonResponse({
            "success": False,
            "message": f"'{livre.titre}' is currently on loan to another campus member.",
            "disponible": False,
        }, status=400)

    livre.disponible = False
    livre.save()

    return JsonResponse({
        "success": True,
        "message": f"Loan confirmed for '{livre.titre}'. Registered for 14-day archival circulation under ESMA policy.",
        "disponible": False,
        "livre_id": livre.id,
        "titre": livre.titre,
    })


@require_http_methods(["POST"])
def api_retourner_livre(request, livre_id):
    """
    Checks a book back into the central stacks, allowing BIBI to place it back on the shelf.
    """
    livre = get_object_or_404(Livre, id=livre_id)
    livre.disponible = True
    livre.save()

    return JsonResponse({
        "success": True,
        "message": f"'{livre.titre}' was successfully returned and restocked in stacks.",
        "disponible": True,
        "livre_id": livre.id,
        "titre": livre.titre,
    })



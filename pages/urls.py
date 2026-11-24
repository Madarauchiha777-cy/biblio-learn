from django.urls import path
from . import views

app_name = "pages"

urlpatterns = [
    # Public Student & Faculty Views
    path("", views.accueil, name="accueil"),
    path("livres/", views.liste_livres, name="livres"),
    path("modules/", views.liste_modules, name="modules"),
    path("mini-cours/", views.liste_mini_cours, name="mini_cours"),

    # Immersive 3D University Library & BIBI Experience
    path("virtual-library/", views.bibliotheque_3d, name="bibliotheque_3d"),
    path("bibliotheque-3d/", views.bibliotheque_3d, name="bibliotheque_3d_alias"),
    path("api/library-3d/", views.api_library_3d, name="api_library_3d"),
    path("api/livres/<int:livre_id>/emprunter/", views.api_emprunter_livre, name="api_emprunter_livre"),
    path("api/livres/<int:livre_id>/retourner/", views.api_retourner_livre, name="api_retourner_livre"),

    # Dedicated Private Admin Dashboard
    path("dashboard-admin/", views.dashboard_admin, name="dashboard_admin"),
    path("dashboard-admin/livres/ajouter/", views.ajouter_livre_admin, name="ajouter_livre_admin"),
    path("dashboard-admin/livres/<int:livre_id>/toggle/", views.toggle_dispo_livre, name="toggle_dispo_livre"),
    path("dashboard-admin/cours/ajouter/", views.ajouter_cours_admin, name="ajouter_cours_admin"),
]

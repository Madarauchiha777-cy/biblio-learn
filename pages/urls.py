from django.urls import path
from . import views

app_name = "pages"

urlpatterns = [
    # Public Student & Faculty Views
    path("", views.accueil, name="accueil"),
    path("livres/", views.liste_livres, name="livres"),
    path("modules/", views.liste_modules, name="modules"),
    path("mini-cours/", views.liste_mini_cours, name="mini_cours"),

    # Dedicated Private Admin Dashboard
    path("dashboard-admin/", views.dashboard_admin, name="dashboard_admin"),
    path("dashboard-admin/livres/ajouter/", views.ajouter_livre_admin, name="ajouter_livre_admin"),
    path("dashboard-admin/livres/<int:livre_id>/toggle/", views.toggle_dispo_livre, name="toggle_dispo_livre"),
    path("dashboard-admin/cours/ajouter/", views.ajouter_cours_admin, name="ajouter_cours_admin"),
]

from django.contrib import admin
from django.utils.html import format_html
from .models import Livre, MiniCours


@admin.register(Livre)
class LivreAdmin(admin.ModelAdmin):
    list_display = (
        "apercu_image",
        "titre",
        "auteur",
        "categorie",
        "annee_publication",
        "nombre_exemplaires",
        "disponible",
        "note",
    )
    list_filter = ("categorie", "disponible", "annee_publication")
    search_fields = ("titre", "auteur", "isbn", "description")
    list_editable = ("disponible", "nombre_exemplaires")

    fieldsets = (
        ("Informations Principales", {
            "fields": ("titre", "auteur", "categorie", "isbn", "annee_publication", "description")
        }),
        ("Illustration & Couverture", {
            "fields": ("image", "image_url", "couleur_couverture", "icone"),
            "description": "Téléversez un fichier image depuis votre ordinateur (recommandé) OU renseignez une URL externe."
        }),
        ("Gestion des Stocks & Disponibilité", {
            "fields": ("nombre_exemplaires", "disponible", "note")
        }),
    )

    def apercu_image(self, obj):
        url = obj.cover_url
        if url:
            return format_html(
                '<img src="{}" style="width: 42px; height: 56px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />',
                url
            )
        return format_html('<span style="color: #999;">Pas d\'image</span>')
    apercu_image.short_description = "Couverture"


@admin.register(MiniCours)
class MiniCoursAdmin(admin.ModelAdmin):
    list_display = (
        "apercu_image",
        "titre",
        "formateur",
        "categorie",
        "niveau",
        "duree",
        "nombre_lecons",
        "populaire",
    )
    list_filter = ("categorie", "niveau", "populaire")
    search_fields = ("titre", "formateur", "description")
    list_editable = ("populaire",)

    fieldsets = (
        ("Informations du Cours", {
            "fields": ("titre", "formateur", "categorie", "niveau", "description")
        }),
        ("Illustration & Thème", {
            "fields": ("image", "image_url", "icone", "couleur"),
            "description": "Téléversez un fichier image depuis votre ordinateur OU collez une URL."
        }),
        ("Métriques & Publication", {
            "fields": ("duree", "nombre_lecons", "populaire")
        }),
    )

    def apercu_image(self, obj):
        url = obj.cover_url
        if url:
            return format_html(
                '<img src="{}" style="width: 52px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />',
                url
            )
        return format_html('<span style="color: #999;">Pas d\'image</span>')
    apercu_image.short_description = "Aperçu"

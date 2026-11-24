from django.db import models


class Categorie(models.TextChoices):
    INFORMATIQUE = "Informatique & Web", "Informatique & Web"
    MANAGEMENT = "Management & Gestion", "Management & Gestion"
    DESIGN = "Design & Multimédia", "Design & Multimédia"
    IA = "Intelligence Artificielle", "Intelligence Artificielle"
    MARKETING = "Marketing & Communication", "Marketing & Communication"


class Livre(models.Model):
    titre = models.CharField(max_length=200, verbose_name="Titre")
    auteur = models.CharField(max_length=150, verbose_name="Auteur")
    categorie = models.CharField(
        max_length=50,
        choices=Categorie.choices,
        default=Categorie.INFORMATIQUE,
        verbose_name="Catégorie",
    )
    isbn = models.CharField(max_length=20, blank=True, verbose_name="Code ISBN")
    annee_publication = models.PositiveIntegerField(
        default=2024, verbose_name="Année"
    )
    description = models.TextField(blank=True, verbose_name="Description")
    nombre_exemplaires = models.PositiveIntegerField(
        default=3, verbose_name="Nombre d'exemplaires"
    )
    disponible = models.BooleanField(default=True, verbose_name="Disponible")
    image = models.ImageField(
        upload_to="livres/",
        blank=True,
        null=True,
        verbose_name="Image de couverture (Fichier)",
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Image de couverture (URL)",
    )
    couleur_couverture = models.CharField(
        max_length=100,
        default="linear-gradient(135deg, #6366f1, #4338ca)",
        verbose_name="Couleur/Dégradé de couverture",
    )
    icone = models.CharField(
        max_length=50,
        default="bi-book",
        verbose_name="Icône d'illustration",
    )
    note = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=4.8,
        verbose_name="Note",
    )
    date_ajout = models.DateTimeField(auto_now_add=True)

    @property
    def cover_url(self):
        """Returns the uploaded image file URL if present, otherwise external URL."""
        if self.image:
            try:
                return self.image.url
            except ValueError:
                pass
        return self.image_url

    class Meta:
        verbose_name = "Livre"
        verbose_name_plural = "Livres"
        ordering = ["-date_ajout"]

    def __str__(self):
        return f"{self.titre} - {self.auteur}"


class CategorieCours(models.TextChoices):
    METHODOLOGIE = "Méthodologie & Recherche", "Méthodologie & Recherche"
    DEVELOPPEMENT = "Développement & Code", "Développement & Code"
    MANAGEMENT = "Management & Stratégie", "Management & Stratégie"
    DESIGN = "Design & Créativité", "Design & Créativité"
    DATA_IA = "Data & Intelligence Artificielle", "Data & Intelligence Artificielle"


class NiveauCours(models.TextChoices):
    DEBUTANT = "Débutant", "Débutant"
    INTERMEDIAIRE = "Intermédiaire", "Intermédiaire"
    AVANCE = "Avancé", "Avancé"


class MiniCours(models.Model):
    titre = models.CharField(max_length=200, verbose_name="Titre du cours")
    formateur = models.CharField(max_length=150, verbose_name="Enseignant / Formateur")
    categorie = models.CharField(
        max_length=60,
        choices=CategorieCours.choices,
        default=CategorieCours.METHODOLOGIE,
        verbose_name="Catégorie",
    )
    niveau = models.CharField(
        max_length=30,
        choices=NiveauCours.choices,
        default=NiveauCours.DEBUTANT,
        verbose_name="Niveau",
    )
    duree = models.CharField(max_length=50, default="45 min", verbose_name="Durée estimée")
    nombre_lecons = models.PositiveIntegerField(default=5, verbose_name="Nombre de leçons")
    description = models.TextField(verbose_name="Description")
    image = models.ImageField(
        upload_to="cours/",
        blank=True,
        null=True,
        verbose_name="Image d'illustration (Fichier)",
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Image d'illustration (URL)",
    )
    icone = models.CharField(max_length=50, default="bi-play-circle-fill", verbose_name="Icône")
    couleur = models.CharField(
        max_length=100,
        default="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        verbose_name="Dégradé de fond",
    )
    populaire = models.BooleanField(default=False, verbose_name="Populaire / En avant")
    date_ajout = models.DateTimeField(auto_now_add=True)

    @property
    def cover_url(self):
        """Returns the uploaded image file URL if present, otherwise external URL."""
        if self.image:
            try:
                return self.image.url
            except ValueError:
                pass
        return self.image_url

    class Meta:
        verbose_name = "Mini-cours"
        verbose_name_plural = "Mini-cours"
        ordering = ["-populaire", "-date_ajout"]

    def __str__(self):
        return f"{self.titre} ({self.formateur})"

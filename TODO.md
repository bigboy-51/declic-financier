# TODO — Declic Financier

## 🔴 Important / Dev

---

## ✅ Fait

- Calendrier dépenses variables — tri par date, total par semaine, date picker pré-rempli à aujourd'hui
- Date salaire éditable depuis dashboard — date picker inline avec choix jour+mois, affichage "reçu le X avr."
- Route `/diag` — diagnostic Firebase (flags, solde étape par étape, incohérences)
- Harmonie visuelle ChargesTab — ChargesRecap aligné sur le design system (tokens, rounded-2xl, barre de progression)
- Bouton "Défi complété" clignotement — déjà corrigé (confetti stops après 3s avec forwards)
- Charges éditables (nom, prévu, réel, restant) + verrou global
- Ajout charges : Thérapeute, Docteur, SNCF, Darty Serv., Darty, Travaux
- Pharmacie fixe → 50 € / Entretien voiture → 50 €
- Reset mensuel budgetCourses à la clôture (archive JSON + remise à zéro)
- Solde compte joint calculé sur les vrais systèmes (charges.reel + budgetCourses + crédits)
- Dashboard simplifié : 6 widgets ordonnés
- Profil financier en tête de l'onglet Défis + bouton refaire quiz
- Migration grocery → budgetCourses (51 entrées, moyens de paiement corrects)

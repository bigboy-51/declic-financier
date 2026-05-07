# TODO — Declic Financier

## 🔴 Important / Dev

---

## 🟠 Fonctionnel

### Calendrier dépenses variables
- Date picker sur chaque dépense variable
- Tri par date
- Total par semaine affiché

### Date salaire éditable depuis le dashboard
- Modifier le jour ET le mois de réception du salaire directement depuis la carte Revenus

### Bouton "Défi complété" — comportement
- Stopper le clignotement après 5 sec max (vérifier si encore actif)

---

## 🟡 UX / UI

### Harmonie visuelle ChargesTab
- Espacement cohérent entre les sections
- Typographie alignée avec le reste de l'app

---

## ✅ Fait

- Route `/diag` — diagnostic Firebase (flags, solde étape par étape, incohérences)
- Charges éditables (nom, prévu, réel, restant) + verrou global
- Ajout charges : Thérapeute, Docteur, SNCF, Darty Serv., Darty, Travaux
- Pharmacie fixe → 50 € / Entretien voiture → 50 €
- Reset mensuel budgetCourses à la clôture (archive JSON + remise à zéro)
- Solde compte joint calculé sur les vrais systèmes (charges.reel + budgetCourses + crédits)
- Dashboard simplifié : 6 widgets ordonnés
- Profil financier en tête de l'onglet Défis + bouton refaire quiz
- Migration grocery → budgetCourses (51 entrées, moyens de paiement corrects)

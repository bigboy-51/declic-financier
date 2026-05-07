# MVP Handoff — Declic Financier MVP

## Contexte

Application de gestion financière personnelle. L'app originale (`bigboy-51/declic-financier`)
est avancée mais a accumulé de la dette technique (deux systèmes en parallèle, migrations
Firebase multiples). Le MVP repart d'une base propre, ciblé célibataire/single.

---

## Repo MVP

**GitHub** : `bigboy-51/declic-financier-mvp`
→ Effacer le contenu existant et repartir from scratch.

**Stack** : React + TypeScript + Vite + TailwindCSS + Firebase RTDB
(même stack que l'original, composants réutilisables)

**Déploiement** : Replit (même workflow — build → Deploy)

---

## Roadmap versions

| Version | Contenu |
|---------|---------|
| **v0.1** | Quiz profil financier + Solde + Revenus + Charges fixes + Courses quotidiennes |
| v0.2 | Crédits + Snowball simplifié |
| v0.3 | Clôture mensuelle + historique |
| v0.4 | Notifications / rappels |
| v1.0 | Défis + gamification |

---

## V0.1 — Détail

### Écrans
1. **Onboarding** : Quiz profil financier (5 questions → profil : Stratège / Explorateur / etc.)
2. **Dashboard** : Solde dynamique + revenus attendus/reçus
3. **Charges** : Liste charges fixes avec prévu / réel / restant + verrou global
4. **Courses** : Saisie dépenses quotidiennes + total cycle

### Profils financiers (réutiliser de l'original)
- `src/lib/profiles.ts` de l'app originale → copier tel quel
- 5 profils : Stratège, Explorateur, Architecte, Équilibriste, Pionnier

---

## Charges fixes par défaut (seed data)

À proposer à chaque nouvel utilisateur via un bouton "Charger des charges types".
Toutes éditables ensuite.

```
Loyer                       600 €    logement
Assurance habitation         15 €    logement
Électricité / gaz            80 €    logement
Eau                          25 €    logement
Internet box                 30 €    logement
Forfait téléphone            15 €    transport
Assurance voiture            70 €    transport
Essence / transport         120 €    transport
Mutuelle santé               40 €    sante
Frais bancaires               5 €    finances
Épargne automatique         100 €    finances
Canal+                       25 €    loisirs
Netflix                      14 €    loisirs
Spotify / Deezer             11 €    loisirs
Amazon Prime                  7 €    loisirs
Salle de sport               30 €    loisirs
Coiffeur                     50 €    loisirs
Cigare                       60 €    loisirs
Loisirs divers               50 €    loisirs
Animal                       50 €    divers
Assurance téléphone          10 €    divers
Cloud / stockage              3 €    divers
Courses alimentaires        250 €    (→ budget courses, pas charges fixes)
```

> Note : "Courses alimentaires" va dans le budget courses quotidiennes, pas dans les charges fixes.

---

## Firebase structure (propre, sans héritage)

```
users/
  {uid}/
    profile/
      type: "single"
      financialProfile: "stratege"
      memberName: string
    finances/
      startingBalance: number
      currentMonth: string        (YYYY-MM)
    incomes/
      {id}/
        name, amount, receiptDay, receivedDate
    charges/
      {catId}/
        rubriques/
          {rubId}/
            name, prevu, reel, restant, locked
    courses/
      {id}/
        date, montant, label, moyenPaiement
    history/
      {YYYY-MM}/
        courses: {...}
        charges: {...}
        closedAt: timestamp

feedback/
  {uid}/
    {timestamp}/
      note: 1-5
      categorie: "bug" | "ux" | "manque"
      message: string
      version: string
      createdAt: timestamp
```

---

## Système de feedback testeurs

### Principe
- Bouton flottant discret dans l'app (coin bas droit)
- Ouvre une modale : note (1-5), catégorie, commentaire libre
- Écrit dans `feedback/{uid}/{timestamp}` (collection globale, hors données user)
- Chaque testeur est isolé (ses données financières restent privées)

### Route `/admin` (cachée)
- Accessible uniquement via URL directe
- Agrège tous les feedbacks de tous les testeurs
- Lecture seule — permet diagnostic par capture d'écran

### Route `/diag` (cachée)
- Affiche l'état technique : solde calculé étape par étape, totaux par système, flags Firebase
- Utile pour débugger sans accès direct à Firebase

---

## Données testeurs persistantes

- Firebase persiste tout par `uid` → un testeur qui revient retrouve ses données
- Bouton "Charger données démo" → pré-remplit avec des montants fictifs réalistes
- Données démo : salaire 2 800 €, charges pré-remplies (liste ci-dessus), solde initial 500 €
- Le testeur peut modifier / compléter sans repartir de zéro

---

## Composants réutilisables depuis l'original

| Composant | Fichier source |
|-----------|---------------|
| Verrou global + modale édition charges | `src/components/ChargesTab.tsx` |
| Saisie courses quotidiennes | `src/components/BudgetCoursesTab.tsx` |
| Widget solde + revenus | `src/components/DashboardHero.tsx` |
| Profils financiers | `src/lib/profiles.ts` |
| Quiz financier | `src/components/FinancialProfileQuiz.tsx` |
| Hook charges Firebase | `src/hooks/useChargesData.ts` |
| Hook courses Firebase | `src/hooks/useBudgetCourses.ts` |

---

## Ce qui ne va PAS dans le MVP

- Système couple (profil boss/wife, invite code, notifications couple)
- Défis / gamification / points
- Escalation system
- Historique détaillé (MonthlyHistory)
- Anciennes migrations (migrateGrocery, migrateCharges V1/V2/V3/V4)
- Savings (épargne objectifs)
- SetupWizard complexe

---

## Notes techniques importantes

- Le remote git push nécessite le token dans l'URL :
  `git remote set-url origin https://ghp_TOKEN@github.com/bigboy-51/declic-financier-mvp.git`
- Build : `npm run build` → `dist/` → Deploy Replit
- Toujours merger sur `main` après chaque session (Replit déploie depuis `main`)
- Ne jamais utiliser de branche feature sauf si explicitement demandé

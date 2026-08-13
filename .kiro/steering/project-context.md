# E-Planner CMR — Contexte du Projet

## Vue d'ensemble

**E-Planner CMR** est une API REST Node.js/TypeScript destinée à la planification d'événements au Cameroun (mariage, anniversaires, conférences, etc.). Elle centralise la recherche de salles, de prestataires, l'estimation budgétaire, la gestion des avis clients et les notifications WhatsApp.

## Stack Technique

| Couche        | Technologie                          |
|---------------|--------------------------------------|
| Runtime       | Node.js >= 18 (LTS)                  |
| Langage       | TypeScript 5.x (strict mode)         |
| Framework     | Express 4.x                          |
| Tests         | Jest + ts-jest + Supertest           |
| Sécurité      | Helmet, express-rate-limit, CORS     |
| Validation    | express-validator                    |
| Build         | tsc → dist/                          |
| Dev           | ts-node-dev (hot-reload)             |

## Architecture des Modules

```
src/
├── index.ts                  # Point d'entrée Express
├── shared/
│   ├── types.ts              # Interfaces TypeScript centrales
│   ├── errors.ts             # Classes d'erreurs métier
│   └── middlewares/          # Middlewares partagés (auth, validation, logger)
└── modules/
    ├── venues/               # Salles événementielles
    ├── vendors/              # Prestataires de services
    ├── budget/               # Estimation budgétaire
    └── reviews/              # Avis clients
```

## Conventions de Code

- **Nommage** : camelCase pour variables/fonctions, PascalCase pour interfaces/types/classes.
- **Fichiers** : kebab-case (ex: `venue.router.ts`, `vendor.service.ts`).
- **Réponses API** : toujours utiliser `ApiResponse<T>` de `shared/types.ts`.
- **Erreurs** : ne jamais exposer les stack traces en production (`NODE_ENV=production`).
- **Validation** : valider toutes les entrées avec `express-validator` avant traitement.
- **Sécurité** : appliquer `helmet()` et `express-rate-limit` sur toutes les routes.

## Modules Fonctionnels

### 1. Venues (Salles)
- Recherche par ville, quartier, capacité, prix, disponibilité
- CRUD complet (admin)
- Interface : `Venue`, `VenueSearchParams`, `VenueCreatePayload`

### 2. Vendors (Prestataires)
- Catégories : caterer, sound, decor, photo
- Filtrage par catégorie, ville, note minimale
- Interface : `Vendor`, `VendorSearchParams`, `VendorCategory`

### 3. Budget
- Estimation automatique basée sur type d'événement, nombre d'invités, ville, budget cible
- Décomposition par service en XAF
- Interfaces : `BudgetEstimateRequest`, `BudgetEstimateResponse`

### 4. Reviews (Avis)
- Avis sur venues ET vendors (targetType: 'venue' | 'vendor')
- Note de 1 à 5, commentaire 10–1000 caractères
- Interface : `Review`, `ReviewCreatePayload`

### 5. WhatsApp Notifications
- Envoi de confirmations et récapitulatifs budgétaires
- Format E.164 pour les numéros (+237...)
- Interfaces : `WhatsAppPayload`, `WhatsAppSendResponse`

## Sécurité (Non-Négociable)

1. **Variables d'environnement** : aucun secret dans le code source, uniquement via `.env` (ignoré par git).
2. **Rate Limiting** : 100 requêtes / 15 min par IP sur toutes les routes publiques.
3. **CORS** : origines autorisées explicitement via `CORS_ORIGIN` dans `.env`.
4. **Helmet** : headers HTTP sécurisés activés par défaut.
5. **Validation** : toutes les entrées sanitisées et validées avant toute logique métier.
6. **Logs** : ne jamais logger de données sensibles (numéros de téléphone complets, etc.).

## Variables d'Environnement Requises

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
WHATSAPP_API_URL=https://api.whatsapp.example.com
WHATSAPP_API_TOKEN=<token_secret>
```

## Monnaie & Localisation

- Devise : **XAF** (Franc CFA d'Afrique Centrale)
- Langue principale : Français
- Villes cibles : Yaoundé, Douala, Bafoussam, Garoua

# Implementation Plan: Module Vendors

## Overview

Implémentation complète du module **Vendors** de l'API E-Planner CMR en TypeScript/Express.
L'approche est incrémentale : types et erreurs partagés en premier, puis stores, validateurs, services,
routeur, intégration dans `src/index.ts`, et enfin la couverture de tests (unitaires, intégration, propriétés).
Chaque tâche s'appuie sur les artefacts produits par les tâches précédentes.
Le langage d'implémentation est **TypeScript 5.x (strict mode)**.

---

## Tasks

- [ ] 1. Étendre `shared/types.ts` avec les types du module Vendors
  - [ ] 1.1 Ajouter `VendorExtendedSearchParams`, `QuoteRequest`, `Quote` et `VendorErrorCode` dans `src/shared/types.ts`
    - Ajouter l'interface `VendorExtendedSearchParams` qui étend `VendorSearchParams` avec `minPrice?`, `maxPrice?`, `page?`, `limit?`
    - Ajouter l'interface `QuoteRequest` (`clientName`, `contact`, `message`, `eventType`)
    - Ajouter l'interface `Quote` qui étend `QuoteRequest` avec `id`, `vendorId`, `createdAt`, `maskedContact`
    - Ajouter le type union `VendorErrorCode` avec les codes `VENDOR_NOT_FOUND | VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | RATE_LIMIT_EXCEEDED | TOO_MANY_REQUESTS | INTERNAL_SERVER_ERROR`
    - Ne pas modifier les interfaces existantes (`Vendor`, `VendorSearchParams`, `VendorCreatePayload`)
    - _Exigences : 1.6, 1.7, 3.1–3.5, 4.1–4.6, 7.1–7.6_

- [ ] 2. Créer les classes d'erreurs métier dans `shared/errors.ts`
  - [ ] 2.1 Implémenter la hiérarchie d'erreurs dans `src/shared/errors.ts`
    - Créer la classe de base `AppError extends Error` avec `message`, `statusCode`, `errorCode`, `errors?: ValidationError[]`
    - Créer `NotFoundError extends AppError` (statusCode 404, errorCode `VENDOR_NOT_FOUND`)
    - Créer `ValidationAppError extends AppError` (statusCode 400, errorCode `VALIDATION_ERROR`, champ `errors`)
    - Créer `UnauthorizedError extends AppError` (statusCode 401, errorCode `UNAUTHORIZED`)
    - Créer `ForbiddenError extends AppError` (statusCode 403, errorCode `FORBIDDEN`)
    - Utiliser `Object.setPrototypeOf(this, new.target.prototype)` dans chaque constructeur pour compatibilité TypeScript
    - _Exigences : 2.2, 2.3, 4.7, 4.8, 5.2, 5.5, 6.2, 6.4, 6.5, 7.6_

- [ ] 3. Créer les middlewares partagés
  - [ ] 3.1 Implémenter `src/shared/middlewares/auth.middleware.ts`
    - Lire le header `Authorization: Bearer <token>`
    - Comparer à `process.env.ADMIN_TOKEN` (ne jamais logger la valeur)
    - Si token absent ou vide : lancer `UnauthorizedError`
    - Si token invalide (non-correspondance) : lancer `ForbiddenError`
    - Exporter la fonction `requireAdmin` comme middleware Express `(req, res, next) => void`
    - _Exigences : 4.8, 5.5, 6.4, 6.5, 7.5_
  - [ ] 3.2 Implémenter `src/shared/middlewares/validate.middleware.ts`
    - Importer `validationResult` de `express-validator`
    - Si des erreurs existent, les mapper vers `ValidationError[]` (`field`, `message`, `rejectedValue`)
    - Lancer `ValidationAppError` avec la liste des erreurs de champ
    - Si aucune erreur, appeler `next()`
    - Exporter la fonction `validate` comme middleware Express
    - _Exigences : 1.8–1.12, 2.2, 3.6, 4.7, 5.3, 5.4, 6.3_
  - [ ] 3.3 Implémenter `src/shared/middlewares/error.middleware.ts`
    - Signature Express error handler à 4 paramètres `(err, req, res, next)`
    - Si `err` est une instance d'`AppError` : utiliser `err.statusCode`, `err.errorCode`, `err.errors`
    - Si `NODE_ENV === 'production'` et `statusCode` non défini ou 500 : remplacer le message par `'Une erreur interne est survenue'`, ne jamais inclure la stack trace
    - Répondre avec la structure `ApiResponse` (champs `success: false`, `message`, `errorCode`, `errors?`, `timestamp`)
    - Exporter la fonction `errorMiddleware`
    - _Exigences : 7.4, 7.6_

- [ ] 4. Checkpoint — Vérifier la compilation des types et middlewares partagés
  - Lancer `npx tsc --noEmit` pour valider que `shared/types.ts`, `shared/errors.ts` et les trois middlewares compilent sans erreur TypeScript.
  - Corriger tout problème avant de continuer.

- [ ] 5. Implémenter `vendor.store.ts` — store en mémoire des prestataires
  - [ ] 5.1 Créer `src/modules/vendors/vendor.store.ts` avec l'interface `IVendorStore` et son implémentation singleton
    - Déclarer l'interface `IVendorStore` avec les méthodes `findAll`, `findById`, `create`, `update`, `delete`, `seed`
    - Implémenter la classe `VendorStore` avec un tableau privé `private vendors: Vendor[]`
    - `findAll()` : retourne une copie superficielle du tableau (`[...this.vendors]`)
    - `findById(id)` : retourne le premier `Vendor` correspondant ou `undefined`
    - `create(vendor)` : arrondir `rating` à 1 décimale via `Math.round((vendor.rating ?? 0) * 10) / 10`, pousser dans le tableau, retourner l'objet normalisé
    - `update(id, data)` : remplacer l'objet existant par `{ id, ...data, rating: Math.round((data.rating ?? 0) * 10) / 10 }`, retourner l'objet mis à jour ou `undefined` si non trouvé
    - `delete(id)` : filtrer le tableau, retourner `true` si supprimé, `false` sinon
    - `seed(vendors)` : remplacer intégralement le tableau (normaliser chaque `rating` à 1 décimale)
    - Exporter une instance singleton `vendorStore` et l'interface `IVendorStore`
    - _Exigences : 1.1–1.7, 2.1, 4.1, 5.1, 6.1, 8.1, 8.2_

- [ ] 6. Implémenter `quote.store.ts` — store en mémoire des demandes de devis
  - [ ] 6.1 Créer `src/modules/vendors/quote.store.ts` avec l'interface `IQuoteStore` et son implémentation singleton
    - Déclarer l'interface `IQuoteStore` avec les méthodes `save`, `findByVendorId`, `findById`, `findAll`, `seed`
    - Implémenter la classe `QuoteStore` avec un tableau privé `private quotes: Quote[]`
    - `save(quote)` : pousser dans le tableau, retourner l'objet
    - `findByVendorId(vendorId)` : retourner tous les devis dont `quote.vendorId === vendorId`
    - `findById(id)` : retourner le devis correspondant ou `undefined`
    - `findAll()` : retourner une copie du tableau
    - `seed(quotes)` : remplacer intégralement le tableau
    - Exporter une instance singleton `quoteStore` et l'interface `IQuoteStore`
    - _Exigences : 3.1, 3.10, 3.11_

- [ ] 7. Implémenter `vendor.validator.ts` — chaînes de validation express-validator
  - [ ] 7.1 Créer `src/modules/vendors/vendor.validator.ts` avec toutes les chaînes de validation
    - Implémenter `isEmailOrCameroonPhone(value: string): boolean` : accepte un email RFC 5322 (via `isEmail()`) ou un numéro commençant par `+237` (E.164, validé via `isMobilePhone('fr-CM')` ou regex)
    - Implémenter `validatePriceRange` comme validateur de body inter-champs : rejeter si `minPrice` et `maxPrice` sont tous les deux présents et `minPrice > maxPrice`
    - Implémenter `validateSearchParams: ValidationChain[]` (query params : `category`, `city`, `minRating`, `minPrice`, `maxPrice`, `page`, `limit` + règle `validatePriceRange`)
    - Implémenter `validateUuidParam: ValidationChain[]` (param `id` isUUID v4)
    - Implémenter `validateVendorPayload: ValidationChain[]` (body : `name` 2–150, `category` enum, `city` 2–100, `priceRange` 3–100, `rating` optionnel 0.0–5.0)
    - Implémenter `validateQuoteRequest: ValidationChain[]` (body : `clientName` 2–100, `contact` via `isEmailOrCameroonPhone`, `message` 10–1000, `eventType` non vide max 100)
    - Toutes les chaînes doivent appeler `.trim()` sur les champs string et `.toFloat()`/`.toInt()` sur les numériques
    - _Exigences : 1.2, 1.3, 1.4, 1.6, 1.8–1.12, 2.2, 3.2–3.6, 3.8, 4.2–4.7, 5.3, 5.4, 5.6, 5.7, 6.3_

- [ ] 8. Implémenter `vendor.service.ts` — logique métier prestataires
  - [ ] 8.1 Créer `src/modules/vendors/vendor.service.ts` avec l'interface `IVendorService` et son implémentation
    - Déclarer l'interface `IVendorService` avec les méthodes `search`, `findById`, `create`, `update`, `delete`
    - Implémenter `search(params: VendorExtendedSearchParams): PaginatedResponse<Vendor>` :
      - Récupérer `vendorStore.findAll()`
      - Appliquer les filtres en AND : `category` (exact), `city` (insensible à la casse), `minRating` (arrondi 1 décimale), `minPrice`/`maxPrice` via `parsePriceRange()` avec chevauchement `parsedMin <= maxPrice && parsedMax >= minPrice`
      - Implémenter `parsePriceRange(priceRange: string): [number, number] | null` en supprimant les espaces avant `parseInt`
      - Paginer : `page` défaut 1, `limit` défaut 20 ; calculer `totalPages`, `hasNextPage`, `hasPreviousPage`
      - Retourner `PaginatedResponse<Vendor>` avec les champs `items` et `pagination`
    - Implémenter `findById(id: string): Vendor` : retourner le vendor ou lancer `new NotFoundError('Prestataire')`
    - Implémenter `create(payload: VendorCreatePayload): Vendor` : générer UUID via `crypto.randomUUID()`, appliquer `rating ?? 0.0`, déléguer à `vendorStore.create()`
    - Implémenter `update(id: string, payload: VendorCreatePayload): Vendor` : vérifier existence (sinon `NotFoundError`), déléguer à `vendorStore.update()`, retourner le vendor mis à jour
    - Implémenter `delete(id: string): void` : vérifier existence (sinon `NotFoundError`), appeler `vendorStore.delete(id)`, puis supprimer les avis associés du module reviews (`reviewStore.deleteByTarget(id, 'vendor')`)
    - Exporter une instance singleton `vendorService`
    - _Exigences : 1.1–1.7, 2.1, 2.3, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 8.1, 8.2_

- [ ] 9. Implémenter `quote.service.ts` — logique métier demandes de devis
  - [ ] 9.1 Créer `src/modules/vendors/quote.service.ts` avec l'interface `IQuoteService` et son implémentation
    - Déclarer l'interface `IQuoteService` avec les méthodes `createQuote` et `maskContact`
    - Implémenter `maskContact(contact: string): string` :
      - Si `contact.startsWith('+237') && contact.length === 13` : retourner `'+237*****' + contact.slice(-4)`
      - Sinon (email ou format inattendu) : retourner `contact` inchangé
    - Implémenter `createQuote(vendorId: string, payload: QuoteRequest): Quote` :
      - Vérifier l'existence du vendor via `vendorService.findById(vendorId)` (lève `NotFoundError` si absent)
      - Masquer le contact : `maskedContact = maskContact(payload.contact)`
      - Ne jamais logger `payload.contact` en clair — utiliser uniquement `maskedContact` dans les logs
      - Construire l'objet `Quote` avec `id = crypto.randomUUID()`, `vendorId`, `createdAt = new Date().toISOString()`, `maskedContact`
      - Persister via `quoteStore.save(quote)`
      - Déclencher la notification WhatsApp : construire un `WhatsAppPayload` avec `recipientPhone` du vendor (si disponible) et message contenant `maskedContact`, envoyer via `fetch` vers `process.env.WHATSAPP_API_URL` avec le header `Authorization: Bearer ${process.env.WHATSAPP_API_TOKEN}`
      - La notification WhatsApp est fire-and-forget : ne pas bloquer la réponse en cas d'échec de notification
      - Retourner l'objet `Quote`
    - Exporter une instance singleton `quoteService`
    - _Exigences : 3.1, 3.7, 3.10, 3.11_

- [ ] 10. Checkpoint — Vérifier la compilation des stores et services
  - Lancer `npx tsc --noEmit` pour valider que `vendor.store.ts`, `quote.store.ts`, `vendor.service.ts`, `quote.service.ts` et `vendor.validator.ts` compilent sans erreur.
  - Corriger tout problème de typage avant de continuer.

- [ ] 11. Implémenter `vendor.router.ts` — routeur Express et application des middlewares
  - [ ] 11.1 Créer `src/modules/vendors/vendor.router.ts` avec toutes les routes et middlewares dans le bon ordre
    - Créer et exporter `globalVendorLimiter` (100 req / 15 min, message `TOO_MANY_REQUESTS`, `ApiResponse` format)
    - Créer et exporter `quoteLimiter` (20 req / 15 min, message `RATE_LIMIT_EXCEEDED`, `ApiResponse` format)
    - Créer le routeur Express : `const router = Router()`
    - Appliquer `helmet()` et `globalVendorLimiter` à l'ensemble du routeur (`router.use(...)`)
    - Câbler les routes dans cet ordre exact :
      - `GET /` → `[...validateSearchParams, validate, searchHandler]`
      - `GET /:id` → `[...validateUuidParam, validate, detailHandler]`
      - `POST /:id/quote` → `[quoteLimiter, ...validateUuidParam, ...validateQuoteRequest, validate, quoteHandler]`
      - `POST /` → `[requireAdmin, ...validateVendorPayload, validate, createHandler]`
      - `PUT /:id` → `[requireAdmin, ...validateUuidParam, ...validateVendorPayload, validate, updateHandler]`
      - `DELETE /:id` → `[requireAdmin, ...validateUuidParam, validate, deleteHandler]`
    - Implémenter chaque handler inline ou comme fonction nommée dans le même fichier :
      - `searchHandler` : appelle `vendorService.search(params)`, répond 200 `ApiResponse<PaginatedResponse<Vendor>>`
      - `detailHandler` : appelle `vendorService.findById(id)`, répond 200 `ApiResponse<Vendor>`
      - `quoteHandler` : appelle `quoteService.createQuote(id, body)`, répond 201 `ApiResponse<{ success: true }>`
      - `createHandler` : appelle `vendorService.create(body)`, répond 201 `ApiResponse<Vendor>`
      - `updateHandler` : appelle `vendorService.update(id, body)`, répond 200 `ApiResponse<Vendor>`
      - `deleteHandler` : appelle `vendorService.delete(id)`, répond 200 `ApiResponse<{ message: string }>`
    - Tous les handlers doivent entourer les appels de service dans un `try/catch` et passer l'erreur à `next(err)`
    - Exporter le `router` comme export par défaut
    - _Exigences : 1.13, 2.4, 3.9, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 12. Créer le barrel export `index.ts` du module
  - [ ] 12.1 Créer `src/modules/vendors/index.ts` qui exporte les éléments publics du module
    - Ré-exporter `router` depuis `./vendor.router` comme export par défaut et nommé `vendorRouter`
    - Ré-exporter `vendorService` et `IVendorService` depuis `./vendor.service`
    - Ré-exporter `quoteService` et `IQuoteService` depuis `./quote.service`
    - Ré-exporter `vendorStore` depuis `./vendor.store`
    - Ré-exporter `quoteStore` depuis `./quote.store`
    - _Exigences : structure du module_

- [ ] 13. Intégrer le module Vendors dans `src/index.ts`
  - [ ] 13.1 Monter le routeur Vendors dans l'application Express principale
    - Importer `vendorRouter` depuis `./modules/vendors`
    - Ajouter `app.use('/api/vendors', vendorRouter)` avant la route 404, après les middlewares de parsing
    - Importer et monter `errorMiddleware` depuis `./shared/middlewares/error.middleware` comme dernier middleware (`app.use(errorMiddleware)`) en remplaçant l'error handler existant
    - Mettre à jour la liste des endpoints dans `GET /api/docs` pour refléter les nouvelles routes
    - _Exigences : 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [ ] 14. Checkpoint — Vérifier la compilation et le démarrage du serveur
  - Lancer `npx tsc --noEmit` sur l'ensemble du projet pour garantir zéro erreur TypeScript.
  - Corriger tout problème avant d'écrire les tests.

- [ ] 15. Écrire les tests unitaires
  - [ ] 15.1 Créer `tests/unit/vendors/vendor.service.test.ts`
    - Mocker `vendorStore` (jest.mock ou injection de dépendance) et `reviewStore`
    - Cas : `search()` sans filtre retourne tous les vendors
    - Cas : filtre `category` — retourne uniquement les vendors de la bonne catégorie
    - Cas : filtre `city` insensible à la casse (ex. `"douala"` vs `"Douala"`)
    - Cas : filtre `minRating` — exclure les vendors sous le seuil
    - Cas : filtres `minPrice`/`maxPrice` — chevauchement de fourchette, échec du parsing → exclusion
    - Cas : filtres combinés en AND
    - Cas : `PaginationMeta` correctement calculée (`totalPages`, `hasNextPage`, `hasPreviousPage`)
    - Cas : `findById()` lève `NotFoundError` si absent
    - Cas : `create()` génère un UUID v4 et applique `rating = 0.0` si absent
    - Cas : `create()` et `update()` délèguent la normalisation du `rating` au store
    - Cas : `delete()` appelle le nettoyage des reviews associées (mock vérifié)
    - _Exigences : 1.1–1.7, 2.1, 2.3, 4.1, 4.6, 5.1, 6.1, 8.1, 8.2_
  - [ ] 15.2 Créer `tests/unit/vendors/quote.service.test.ts`
    - Mocker `vendorService` et `quoteStore`
    - Cas : `maskContact('+237612345678')` → `'+237*****5678'`
    - Cas : `maskContact('user@example.com')` → `'user@example.com'` (inchangé)
    - Cas : `maskContact('+2376')` → `'+2376'` (longueur != 13, retourné tel quel)
    - Cas : `createQuote()` lève `NotFoundError` si le vendor n'existe pas
    - Cas : `createQuote()` persiste la Quote dans `quoteStore.save()` (mock appelé une fois)
    - Cas : `createQuote()` déclenche la notification WhatsApp avec le contact masqué (mock vérifié)
    - _Exigences : 3.1, 3.7, 3.10, 3.11_
  - [ ]* 15.3 Créer `tests/unit/vendors/vendor.validator.test.ts`
    - Cas aux bornes pour `name` (1 char invalide, 2 chars valide, 150 chars valide, 151 chars invalide)
    - Cas aux bornes pour `city` (1 char invalide, 2 chars valide)
    - Cas aux bornes pour `priceRange` (2 chars invalide, 3 chars valide)
    - Cas aux bornes pour `clientName` et `message`
    - Toutes les valeurs valides et invalides de `category`
    - Formats `contact` : emails valides/invalides, téléphones `+237` valides/invalides
    - Rejet quand `minPrice > maxPrice`
    - Rejet quand `minRating` hors `[0.0, 5.0]`
    - _Exigences : 1.8–1.12, 3.2–3.5, 4.2–4.7_

- [ ] 16. Écrire les tests d'intégration
  - [ ] 16.1 Créer `tests/integration/vendors/vendors.search.test.ts`
    - Seeder les stores dans `beforeEach` et réinitialiser dans `afterEach`
    - Cas : `GET /api/vendors` sans filtre → 200, `PaginatedResponse` valide avec `pagination` correcte
    - Cas : filtre `category=caterer` → 200, uniquement caterers
    - Cas : filtre `city=Douala` → 200, correspondance insensible à la casse
    - Cas : filtre `minRating=4.0` → 200, uniquement vendors avec `rating >= 4.0`
    - Cas : filtres combinés `category + city + minRating` → 200, résultats corrects
    - Cas : `category=invalid` → 400 `VALIDATION_ERROR`
    - Cas : `minRating=6` → 400 `VALIDATION_ERROR`
    - Cas : `page=0` → 400, `limit=101` → 400
    - Cas : `minPrice=5000&maxPrice=1000` → 400 `VALIDATION_ERROR`
    - _Exigences : 1.1–1.13_
  - [ ] 16.2 Créer `tests/integration/vendors/vendors.detail.test.ts`
    - Cas : `GET /api/vendors/:id` avec id existant → 200, objet `Vendor` complet
    - Cas : id non-UUID → 400 `VALIDATION_ERROR`
    - Cas : UUID valide mais inexistant → 404 `VENDOR_NOT_FOUND`
    - _Exigences : 2.1–2.4_
  - [ ] 16.3 Créer `tests/integration/vendors/vendors.quote.test.ts`
    - Cas : `POST /api/vendors/:id/quote` avec payload valide (email) → 201
    - Cas : payload valide avec téléphone `+237` → 201
    - Cas : chaque champ invalide isolément → 400 `VALIDATION_ERROR` avec détail du champ
    - Cas : vendor inexistant → 404 `VENDOR_NOT_FOUND`
    - Cas : id non-UUID → 400 `VALIDATION_ERROR`
    - _Exigences : 3.1–3.9_
  - [ ] 16.4 Créer `tests/integration/vendors/vendors.admin.test.ts`
    - Cas : `POST /api/vendors` avec token admin valide + payload valide → 201, UUID attribué
    - Cas : `POST /api/vendors` sans token → 401 `UNAUTHORIZED`
    - Cas : `POST /api/vendors` avec token invalide → 403 `FORBIDDEN`
    - Cas : `POST /api/vendors` avec payload invalide → 400 `VALIDATION_ERROR`
    - Cas : `PUT /api/vendors/:id` avec token admin + payload valide → 200, données mises à jour
    - Cas : `PUT /api/vendors/:id` sur UUID inexistant → 404 `VENDOR_NOT_FOUND`
    - Cas : `DELETE /api/vendors/:id` avec token admin → 200, `GET` ultérieur → 404
    - Cas : `DELETE /api/vendors/:id` sans token → 401
    - _Exigences : 4.1–4.8, 5.1–5.8, 6.1–6.5_

- [ ] 17. Écrire les tests de propriétés (fast-check)
  - [ ] 17.1 Créer `tests/property/vendors/vendors.property.test.ts` avec les arbitraires et les 9 propriétés
    - Installer `fast-check` si absent : `npm install --save-dev fast-check`
    - Configurer globalement : `fc.configureGlobal({ numRuns: 100, verbose: true })`
    - Implémenter les arbitraires : `arbitraryVendor()`, `arbitraryVendorList()`, `arbitraryVendorCreatePayload()`, `arbitrarySearchParams()` (avec correction `minPrice > maxPrice`), `arbitraryValidQuoteRequest()`, `arbitraryCameroonPhone()` (exactement `+237` + 9 chiffres)
    - Dans `beforeEach` : réinitialiser les stores via `vendorStore.seed([])` et `quoteStore.seed([])`
  - [ ]* 17.2 Écrire le test de la Propriété 1 — Invariant de filtre de recherche
    - Tag : `// Feature: vendors, Property 1: tout résultat satisfait tous les filtres actifs`
    - `fc.property(arbitraryVendorList(), arbitrarySearchParams(), (vendors, params) => ...)`
    - Seeder le store, appeler `vendorService.search(params)`, vérifier que chaque item satisfait simultanément tous les critères fournis
    - **Validates: Exigences 1.2, 1.3, 1.4, 1.6, 1.7, 8.2**
  - [ ]* 17.3 Écrire le test de la Propriété 2 — Cohérence de la pagination
    - Tag : `// Feature: vendors, Property 2: invariants de pagination toujours respectés`
    - `fc.property(arbitraryVendorList(), fc.integer({ min: 1, max: 10 }), fc.integer({ min: 1, max: 100 }), ...)`
    - Vérifier : `items.length <= limit`, `totalItems === vendors.length`, `totalPages === Math.ceil(N / limit)`
    - **Validates: Exigences 1.1, 1.5**
  - [ ]* 17.4 Écrire le test de la Propriété 3 — Invariant de la note de prestataire
    - Tag : `// Feature: vendors, Property 3: rating invariant [0,5] sur toutes les réponses`
    - `fc.property(arbitraryVendorList(), (vendors) => ...)`
    - Vérifier que chaque `vendor.rating` dans le résultat est dans `[0.0, 5.0]` et est arrondi à 1 décimale
    - **Validates: Exigences 8.1, 8.2**
  - [ ]* 17.5 Écrire le test de la Propriété 4 — Round-trip lecture par identifiant
    - Tag : `// Feature: vendors, Property 4: GET/:id retourne exactement l'objet stocké`
    - `fc.property(arbitraryVendor(), (vendor) => ...)`
    - Seeder avec ce vendor, appeler `vendorService.findById(vendor.id)`, vérifier l'égalité profonde
    - **Validates: Exigence 2.1**
  - [ ]* 17.6 Écrire le test de la Propriété 5 — Création préserve les données et attribue un UUID valide
    - Tag : `// Feature: vendors, Property 5: création préserve les données`
    - `fc.property(arbitraryVendorCreatePayload(), (payload) => ...)`
    - Vérifier : `created.id` est un UUID v4, champs `name/category/city/priceRange` identiques au payload, `rating` correct
    - **Validates: Exigences 4.1, 4.2, 4.6**
  - [ ]* 17.7 Écrire le test de la Propriété 6 — Mise à jour remplace intégralement les données
    - Tag : `// Feature: vendors, Property 6: PUT remplace intégralement le prestataire`
    - `fc.property(arbitraryVendor(), arbitraryVendorCreatePayload(), (existing, newPayload) => ...)`
    - Vérifier : `updated.id === existing.id`, tous les autres champs reflètent le `newPayload`
    - **Validates: Exigence 5.1**
  - [ ]* 17.8 Écrire le test de la Propriété 7 — Suppression assure l'intégrité référentielle
    - Tag : `// Feature: vendors, Property 7: DELETE assure l'intégrité référentielle`
    - `fc.property(arbitraryVendor(), fc.array(arbitraryReview(), { maxLength: 10 }), ...)`
    - Seeder vendor + reviews associées, appeler `vendorService.delete()`, vérifier que `findById` lève une erreur et que les reviews sont supprimées
    - **Validates: Exigence 6.1**
  - [ ]* 17.9 Écrire le test de la Propriété 8 — Validation des champs du QuoteRequest
    - Tag : `// Feature: vendors, Property 8: QuoteRequest valide accepté`
    - `fc.property(arbitraryValidQuoteRequest(), (payload) => ...)`
    - Vérifier qu'un payload valide ne génère aucune erreur de validation (utiliser `validateQuoteRequestSync`)
    - **Validates: Exigences 3.1–3.5, 3.6**
  - [ ]* 17.10 Écrire le test de la Propriété 9 — Masquage du numéro de téléphone
    - Tag : `// Feature: vendors, Property 9: maskContact retourne +237*****XXXX`
    - `fc.property(arbitraryCameroonPhone(), (phone) => ...)`
    - Vérifier : résultat `=== '+237*****' + phone.slice(-4)`, longueur `=== 13`, commence par `'+237'`
    - **Validates: Exigence 3.10**

- [ ] 18. Checkpoint final — Lancer la suite de tests complète
  - Lancer `npx jest --forceExit --detectOpenHandles` et s'assurer que tous les tests passent.
  - Vérifier la couverture de code sur `src/modules/vendors/**` et `src/shared/**`.
  - Corriger toute régression avant de clore l'implémentation.

---

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être différées pour un MVP rapide.
- Chaque tâche référence des exigences spécifiques pour assurer la traçabilité.
- Les checkpoints (tâches 4, 10, 14, 18) garantissent une validation incrémentale.
- `fast-check` doit être ajouté aux `devDependencies` si absent (`npm install --save-dev fast-check`).
- L'`ADMIN_TOKEN` est exclusivement lu depuis `process.env.ADMIN_TOKEN` — ne jamais le hardcoder.
- La normalisation du `rating` à 1 décimale est une responsabilité du **store**, pas du service.
- La notification WhatsApp est fire-and-forget : un échec de notification ne doit pas faire échouer la requête `/quote`.
- Les propriétés PBT (17.2 à 17.10) exercent le code avec 100 entrées générées chacune — les arbitraires doivent produire uniquement des valeurs valides selon les contraintes métier.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "6.1"] },
    { "id": 4, "tasks": ["7.1"] },
    { "id": 5, "tasks": ["8.1", "9.1"] },
    { "id": 6, "tasks": ["11.1"] },
    { "id": 7, "tasks": ["12.1"] },
    { "id": 8, "tasks": ["13.1"] },
    { "id": 9, "tasks": ["15.1", "15.2", "15.3", "16.1", "16.2", "16.3", "16.4"] },
    { "id": 10, "tasks": ["17.1"] },
    { "id": 11, "tasks": ["17.2", "17.3", "17.4", "17.5", "17.6", "17.7", "17.8", "17.9", "17.10"] }
  ]
}
```

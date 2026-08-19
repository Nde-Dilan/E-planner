# Requirements Document

## Introduction

Le module **Vendors** du projet **E-Planner CMR** expose une API REST permettant de rechercher, consulter et contacter des prestataires de services événementiels au Cameroun (traiteurs, sonorisation, décoration, photographie). Il offre également un CRUD complet réservé aux administrateurs pour gérer le catalogue de prestataires. Toutes les réponses respectent le contrat `ApiResponse<T>` défini dans `shared/types.ts`.

---

## Glossary

- **Vendor** : Prestataire de services proposant ses prestations pour des événements (mariage, anniversaire, conférence, etc.). Modélisé par l'interface `Vendor` de `shared/types.ts`.
- **VendorCategory** : Catégorie de service du prestataire. Valeurs possibles : `caterer` (traiteur), `sound` (sonorisation), `decor` (décoration), `photo` (photographie).
- **VendorCreatePayload** : Objet de création d'un prestataire, correspondant à `Omit<Vendor, 'id'>`.
- **VendorSearchParams** : Paramètres de filtrage des prestataires : `category`, `city`, `minRating`.
- **QuoteRequest** : Demande de devis ou de contact émise par un client vers un prestataire. Contient le nom du client, ses coordonnées, un message et le type d'événement.
- **PaginatedResponse** : Réponse paginée générique, structurée selon `PaginatedResponse<T>` de `shared/types.ts`.
- **ApiResponse** : Enveloppe standardisée de toutes les réponses API, structurée selon `ApiResponse<T>`.
- **Admin** : Utilisateur disposant du rôle administrateur, autorisé à créer, modifier et supprimer des prestataires.
- **Rate_Limiter** : Mécanisme `express-rate-limit` limitant les requêtes à 100 par tranche de 15 minutes par adresse IP.
- **Validator** : Composant `express-validator` chargé de valider et sanitiser les données d'entrée avant tout traitement métier.
- **XAF** : Franc CFA d'Afrique Centrale, devise exclusive de la plateforme.
- **E.164** : Format international des numéros de téléphone (ex. : `+237612345678`).
- **UUID** : Identifiant unique universel (version 4) utilisé comme identifiant de ressource.

---

## Requirements

### Exigence 1 : Recherche multicritère de prestataires

**User Story :** En tant que client, je veux filtrer les prestataires par catégorie, ville, fourchette de prix et note minimale, afin de trouver rapidement le professionnel adapté à mon événement.

#### Critères d'acceptation

1. WHEN une requête `GET /api/vendors` est reçue sans paramètre de filtre, THE Vendor_Search_Service SHALL retourner l'ensemble des prestataires paginés selon les valeurs par défaut `page=1` et `limit=20`.
2. WHEN une requête `GET /api/vendors` est reçue avec le paramètre `category`, THE Vendor_Search_Service SHALL retourner uniquement les prestataires dont la catégorie correspond exactement à la valeur fournie parmi `caterer`, `sound`, `decor`, `photo`.
3. WHEN une requête `GET /api/vendors` est reçue avec le paramètre `city`, THE Vendor_Search_Service SHALL retourner uniquement les prestataires dont la ville correspond à la valeur fournie (correspondance insensible à la casse, valeur non vide, 100 caractères maximum).
4. WHEN une requête `GET /api/vendors` est reçue avec le paramètre `minRating`, THE Vendor_Search_Service SHALL retourner uniquement les prestataires dont le champ `rating` (arrondi à 1 décimale) est supérieur ou égal à la valeur fournie.
5. WHEN une requête `GET /api/vendors` est reçue avec les paramètres `page` et `limit`, THE Vendor_Search_Service SHALL retourner les prestataires correspondant à la page demandée avec le nombre d'éléments par page demandé, dans une `PaginatedResponse<Vendor>` encapsulée dans `ApiResponse`.
6. WHEN une requête `GET /api/vendors` est reçue avec les paramètres `minPrice` et/ou `maxPrice` (en XAF, entiers positifs), THE Vendor_Search_Service SHALL retourner uniquement les prestataires dont la fourchette de prix chevauche l'intervalle `[minPrice, maxPrice]` (bornes incluses).
7. WHEN plusieurs filtres sont combinés simultanément, THE Vendor_Search_Service SHALL appliquer tous les filtres actifs avec une logique ET (AND), ne retournant que les prestataires satisfaisant l'ensemble des critères fournis.
8. IF le paramètre `category` fourni n'appartient pas à l'ensemble `{caterer, sound, decor, photo}`, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
9. IF le paramètre `minRating` fourni est en dehors de l'intervalle `[0.0, 5.0]`, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
10. IF le paramètre `page` fourni est inférieur à 1 ou n'est pas un entier, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
11. IF le paramètre `limit` fourni est supérieur à 100 ou inférieur à 1, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
12. IF `minPrice` ou `maxPrice` est négatif, non entier, ou si `minPrice > maxPrice`, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
13. WHILE le Rate_Limiter est actif, THE Rate_Limiter SHALL bloquer toute adresse IP ayant dépassé 100 requêtes sur la route `GET /api/vendors` dans une fenêtre de 15 minutes et retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `RATE_LIMIT_EXCEEDED` et le statut HTTP 429.

---

### Exigence 2 : Consultation de la fiche détail d'un prestataire

**User Story :** En tant que client, je veux consulter le profil complet d'un prestataire, afin d'obtenir toutes les informations nécessaires avant de le contacter.

#### Critères d'acceptation

1. WHEN une requête `GET /api/vendors/:id` est reçue avec un identifiant `id` correspondant à un prestataire existant, THE Vendor_Service SHALL retourner une réponse `ApiResponse<Vendor>` avec `success: true`, le statut HTTP 200, et le champ `data` contenant l'objet `Vendor` complet.
2. IF l'identifiant `id` fourni n'est pas un UUID v4 valide, THEN THE Validator SHALL évaluer la validation de format en premier et retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400, avant toute vérification d'existence dans le catalogue.
3. IF l'identifiant `id` fourni est un UUID valide mais ne correspond à aucun prestataire dans le catalogue, THEN THE Vendor_Service SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VENDOR_NOT_FOUND` et le statut HTTP 404.
4. WHILE le Rate_Limiter est actif, THE Rate_Limiter SHALL bloquer toute adresse IP ayant dépassé 100 requêtes sur la route `GET /api/vendors/:id` dans une fenêtre de 15 minutes et retourner le statut HTTP 429.

---

### Exigence 3 : Demande de devis / contact prestataire

**User Story :** En tant que client, je veux envoyer une demande de devis à un prestataire, afin d'obtenir une proposition commerciale adaptée à mon événement.

#### Critères d'acceptation

1. WHEN une requête `POST /api/vendors/:id/quote` est reçue avec un `id` valide et un payload `QuoteRequest` valide, THE Quote_Service SHALL enregistrer la demande et retourner une réponse `ApiResponse` avec `success: true` et le statut HTTP 201.
2. THE Validator SHALL exiger que le champ `clientName` du payload `QuoteRequest` soit une chaîne non vide d'au moins 2 caractères et d'au plus 100 caractères.
3. THE Validator SHALL exiger que le champ `contact` du payload `QuoteRequest` soit soit une adresse email valide (format RFC 5322), soit un numéro de téléphone au format E.164 commençant par `+237`.
4. THE Validator SHALL exiger que le champ `message` du payload `QuoteRequest` soit une chaîne non vide d'au moins 10 caractères et d'au plus 1000 caractères.
5. THE Validator SHALL exiger que le champ `eventType` du payload `QuoteRequest` soit une chaîne non vide d'au plus 100 caractères.
6. IF un champ obligatoire du payload `QuoteRequest` est absent ou ne respecte pas les règles de validation, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR`, la liste des erreurs de champ et le statut HTTP 400.
7. IF l'identifiant `id` fourni ne correspond à aucun prestataire dans le catalogue, THEN THE Quote_Service SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VENDOR_NOT_FOUND` et le statut HTTP 404.
8. IF l'identifiant `id` fourni n'est pas un UUID valide, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
9. WHILE le Rate_Limiter est actif, THE Rate_Limiter SHALL bloquer toute adresse IP ayant dépassé 100 requêtes sur la route `POST /api/vendors/:id/quote` dans une fenêtre glissante de 15 minutes et retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `RATE_LIMIT_EXCEEDED` et le statut HTTP 429.
10. THE Quote_Service SHALL masquer le numéro de téléphone dans les journaux applicatifs en ne conservant visibles que les 4 derniers chiffres (format `+237*****XXXX`).
11. WHEN une demande de devis est enregistrée avec succès, THE Quote_Service SHALL déclencher une notification (via WhatsApp ou équivalent) vers le prestataire concerné avec les informations de contact masquées du client.

---

### Exigence 4 : Création d'un prestataire (Admin)

**User Story :** En tant qu'administrateur, je veux créer un nouveau prestataire dans le catalogue, afin d'enrichir l'offre disponible pour les clients.

#### Critères d'acceptation

1. WHEN une requête `POST /api/vendors` est reçue avec un payload `VendorCreatePayload` valide et des droits administrateur, THE Vendor_Admin_Service SHALL créer le prestataire, lui attribuer un UUID unique et retourner une réponse `ApiResponse<Vendor>` avec `success: true` et le statut HTTP 201.
2. THE Validator SHALL exiger que le champ `name` du payload soit une chaîne non vide d'au moins 2 caractères et d'au plus 150 caractères.
3. THE Validator SHALL exiger que le champ `category` du payload appartienne à l'ensemble `{caterer, sound, decor, photo}`.
4. THE Validator SHALL exiger que le champ `city` du payload soit une chaîne non vide d'au moins 2 caractères et d'au plus 100 caractères.
5. THE Validator SHALL exiger que le champ `priceRange` du payload soit une chaîne non vide d'au moins 3 caractères et d'au plus 100 caractères (ex. : `"50 000 - 150 000 XAF"`).
6. THE Validator SHALL traiter le champ `rating` du payload comme optionnel ; s'il est fourni, il doit être un nombre décimal compris dans l'intervalle `[0.0, 5.0]` avec deux décimales au maximum ; s'il est absent, la valeur par défaut `0.0` est appliquée.
7. IF un champ obligatoire parmi `name`, `category`, `city`, ou `priceRange` est absent ou invalide, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR`, la liste des champs en erreur et le statut HTTP 400.
8. IF la requête `POST /api/vendors` est émise sans droits administrateur, THEN THE Auth_Middleware SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `UNAUTHORIZED` et le statut HTTP 401.

---

### Exigence 5 : Mise à jour d'un prestataire (Admin)

**User Story :** En tant qu'administrateur, je veux modifier les informations d'un prestataire existant, afin de maintenir le catalogue à jour.

#### Critères d'acceptation

1. WHEN une requête `PUT /api/vendors/:id` est reçue avec un `id` valide, un payload `VendorCreatePayload` valide et des droits administrateur, THE Vendor_Admin_Service SHALL remplacer l'intégralité des champs du prestataire et retourner une réponse `ApiResponse<Vendor>` avec `success: true`, le statut HTTP 200 et le champ `data` reflétant l'état post-mise à jour du prestataire.
2. IF l'identifiant `id` fourni ne correspond à aucun prestataire dans le catalogue, THEN THE Vendor_Admin_Service SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VENDOR_NOT_FOUND` et le statut HTTP 404.
3. IF l'identifiant `id` fourni n'est pas un UUID valide, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
4. IF un champ du payload `VendorCreatePayload` ne respecte pas les règles définies aux critères 6, 7 et 8, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
5. IF la requête `PUT /api/vendors/:id` est émise sans droits administrateur, THEN THE Auth_Middleware SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `UNAUTHORIZED` et le statut HTTP 401.
6. THE Validator SHALL exiger que les champs `name` (2–150 car.), `category` (`{caterer, sound, decor, photo}`), `city` (2–100 car.) et `priceRange` (3–100 car.) du payload respectent les mêmes contraintes de longueur et de valeur que pour la création (Exigence 4).
7. THE Validator SHALL exiger que le champ `rating`, s'il est fourni, soit un nombre décimal dans `[0.0, 5.0]` avec deux décimales au maximum.
8. THE Validator SHALL traiter tous les champs de `VendorCreatePayload` comme obligatoires dans le contexte d'un PUT (remplacement complet) ; l'absence de l'un d'eux doit déclencher le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.

---

### Exigence 6 : Suppression d'un prestataire (Admin)

**User Story :** En tant qu'administrateur, je veux supprimer un prestataire du catalogue, afin de retirer les prestataires inactifs ou incorrects.

#### Critères d'acceptation

1. WHEN une requête `DELETE /api/vendors/:id` est reçue avec un `id` valide et des droits administrateur, THE Vendor_Admin_Service SHALL définitivement supprimer le prestataire du catalogue, supprimer les avis associés (reviews avec `targetId = id` et `targetType = 'vendor'`), et retourner une réponse `ApiResponse` avec `success: true` et le statut HTTP 200 ; un `GET /api/vendors/:id` ultérieur sur le même `id` devra retourner 404.
2. IF l'identifiant `id` fourni ne correspond à aucun prestataire dans le catalogue, THEN THE Vendor_Admin_Service SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VENDOR_NOT_FOUND` et le statut HTTP 404.
3. IF l'identifiant `id` fourni n'est pas un UUID valide, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.
4. IF la requête `DELETE /api/vendors/:id` est émise sans token d'authentification ou avec un token invalide, THEN THE Auth_Middleware SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `UNAUTHORIZED` et le statut HTTP 401.
5. IF la requête `DELETE /api/vendors/:id` est émise avec un token valide mais dont le rôle est insuffisant (non administrateur), THEN THE Auth_Middleware SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `FORBIDDEN` et le statut HTTP 403.

---

### Exigence 7 : Sécurité et protection des routes

**User Story :** En tant que responsable technique, je veux que toutes les routes du module Vendors appliquent les politiques de sécurité définies, afin de protéger l'API contre les abus et les accès non autorisés.

#### Critères d'acceptation

1. THE Vendor_Router SHALL appliquer le middleware `helmet()` sur l'ensemble des routes du module Vendors.
2. THE Rate_Limiter SHALL limiter à 100 requêtes par adresse IP par tranche de 15 minutes sur toutes les routes du module Vendors.
3. WHEN une adresse IP dépasse la limite de 100 requêtes dans la fenêtre de 15 minutes, THE Rate_Limiter SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `TOO_MANY_REQUESTS` et le statut HTTP 429.
4. IF la variable d'environnement `NODE_ENV` est définie à `production`, THEN THE Vendor_Router SHALL ne jamais inclure de stack trace dans les réponses d'erreur, quelle que soit l'erreur survenue.
5. THE Vendor_Router SHALL ne jamais inclure de valeurs de secrets ou de tokens en clair dans le code source du module ; toute valeur sensible doit être chargée exclusivement via des variables d'environnement.
6. IF une erreur interne survient lors du traitement d'une requête, THEN THE Vendor_Router SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `INTERNAL_SERVER_ERROR` et le statut HTTP 500, sans exposer de détails internes.

---

### Exigence 8 : Cohérence et intégrité des données de notation

**User Story :** En tant que développeur, je veux que le champ `rating` des prestataires reste toujours dans l'intervalle valide, afin de garantir la fiabilité des données affichées aux clients.

#### Critères d'acceptation

1. WHEN `GET /api/vendors` ou `GET /api/vendors/:id` retourne un objet `Vendor`, THE Vendor_Service SHALL garantir que le champ `rating` est un nombre décimal arrondi à 1 décimale appartenant à l'intervalle fermé `[0.0, 5.0]`.
2. WHEN le Vendor_Search_Service filtre les prestataires par `minRating`, THE Vendor_Search_Service SHALL retourner uniquement des prestataires dont le `rating` (arrondi à 1 décimale) est supérieur ou égal à `minRating`, quelle que soit la combinaison d'autres filtres appliqués simultanément.
3. IF le paramètre `minRating` fourni n'est pas un nombre décimal valide dans l'intervalle `[0.0, 5.0]`, THEN THE Validator SHALL retourner une réponse `ApiResponse` avec `success: false`, le code d'erreur `VALIDATION_ERROR` et le statut HTTP 400.

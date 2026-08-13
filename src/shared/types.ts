/**
 * @file types.ts
 * @description Interfaces TypeScript partagées pour tous les modules E-Planner CMR.
 *              Ce fichier constitue le contrat de données central de l'application.
 *
 * Modules couverts :
 *  - Venues   : Salles et espaces événementiels
 *  - Vendors  : Prestataires de services
 *  - Budget   : Estimation budgétaire
 *  - Reviews  : Avis et évaluations
 *  - WhatsApp : Notifications via WhatsApp
 */

// ─────────────────────────────────────────────
// MODULE : VENUES
// ─────────────────────────────────────────────

/**
 * Représente une salle ou un espace événementiel disponible à la location.
 */
export interface Venue {
  /** Identifiant unique de la salle (UUID v4 recommandé) */
  id: string;

  /** Nom officiel de l'établissement */
  name: string;

  /** Ville où se situe la salle (ex: "Yaoundé", "Douala") */
  city: string;

  /** Quartier précis dans la ville */
  neighborhood: string;

  /** Capacité maximale en nombre de personnes */
  capacity: number;

  /** Prix de location pour une journée complète (en XAF) */
  pricePerDay: number;

  /**
   * Liste des équipements et services inclus
   * Exemples : ["climatisation", "parking", "wifi", "scène", "sonorisation de base"]
   */
  amenities: string[];

  /** Indique si la salle est disponible à la réservation */
  availabilityStatus: boolean;
}

/**
 * Payload pour la création ou la mise à jour d'une salle.
 * Omet l'id qui est généré côté serveur.
 */
export type VenueCreatePayload = Omit<Venue, 'id'>;

/**
 * Paramètres de recherche / filtrage des salles.
 * Tous les champs sont optionnels pour permettre des recherches partielles.
 */
export interface VenueSearchParams {
  city?: string;
  neighborhood?: string;
  minCapacity?: number;
  maxCapacity?: number;
  maxPricePerDay?: number;
  availabilityStatus?: boolean;
  amenities?: string[];
}

// ─────────────────────────────────────────────
// MODULE : VENDORS
// ─────────────────────────────────────────────

/**
 * Catégories de prestataires supportées par la plateforme.
 */
export type VendorCategory = 'caterer' | 'sound' | 'decor' | 'photo';

/**
 * Représente un prestataire de services pour un événement.
 */
export interface Vendor {
  /** Identifiant unique du prestataire (UUID v4 recommandé) */
  id: string;

  /** Nom de l'entreprise ou du prestataire indépendant */
  name: string;

  /** Catégorie de service proposé */
  category: VendorCategory;

  /** Ville d'opération principale */
  city: string;

  /**
   * Fourchette de prix indicative (en XAF)
   * Format libre : ex. "50 000 - 150 000 XAF"
   */
  priceRange: string;

  /**
   * Note moyenne des clients
   * Valeur entre 0.0 et 5.0 (deux décimales max)
   */
  rating: number;
}

/**
 * Payload pour la création ou la mise à jour d'un prestataire.
 */
export type VendorCreatePayload = Omit<Vendor, 'id'>;

/**
 * Paramètres de filtrage des prestataires.
 */
export interface VendorSearchParams {
  category?: VendorCategory;
  city?: string;
  minRating?: number;
}

// ─────────────────────────────────────────────
// MODULE : BUDGET
// ─────────────────────────────────────────────

/**
 * Types d'événements supportés pour l'estimation budgétaire.
 */
export type EventType =
  | 'wedding'       // Mariage
  | 'birthday'      // Anniversaire
  | 'corporate'     // Événement d'entreprise
  | 'baptism'       // Baptême / Naissance
  | 'conference'    // Conférence / Séminaire
  | 'concert'       // Concert / Spectacle
  | 'other';        // Autre

/**
 * Requête d'estimation budgétaire soumise par le client.
 */
export interface BudgetEstimateRequest {
  /** Type d'événement à organiser */
  eventType: EventType | string;

  /** Nombre d'invités attendus */
  guestCount: number;

  /** Ville où se déroulera l'événement */
  city: string;

  /** Budget cible exprimé en XAF */
  targetBudget: number;
}

/**
 * Réponse de l'estimation budgétaire générée par le serveur.
 */
export interface BudgetEstimateResponse {
  /** Coût total estimé en XAF */
  totalEstimated: number;

  /**
   * Décomposition du budget par catégorie de service.
   * La clé est le nom du service, la valeur est le montant estimé en XAF.
   * Exemple :
   * {
   *   "venue":    150000,
   *   "catering": 200000,
   *   "sound":     50000,
   *   "decor":     80000,
   *   "photo":     70000
   * }
   */
  breakdownByService: Record<string, number>;

  /** Indique si le budget cible est suffisant */
  isBudgetSufficient: boolean;

  /** Différence entre le budget cible et l'estimation (peut être négative) */
  budgetGap: number;

  /** Recommandations générées pour optimiser le budget */
  recommendations?: string[];
}

// ─────────────────────────────────────────────
// MODULE : REVIEWS
// ─────────────────────────────────────────────

/**
 * Représente un avis client laissé sur une salle ou un prestataire.
 */
export interface Review {
  /** Identifiant unique de l'avis (UUID v4 recommandé) */
  id: string;

  /**
   * Identifiant de la cible évaluée.
   * Peut pointer vers un Venue.id ou un Vendor.id.
   */
  targetId: string;

  /**
   * Type de la cible évaluée, pour distinguer venues et vendors.
   */
  targetType: 'venue' | 'vendor';

  /**
   * Note attribuée par le client.
   * Valeur entière entre 1 et 5.
   */
  rating: number;

  /**
   * Commentaire textuel de l'avis.
   * Longueur minimale : 10 caractères. Longueur maximale : 1000 caractères.
   */
  comment: string;

  /**
   * Date de publication de l'avis.
   * Format ISO 8601 : "YYYY-MM-DDTHH:mm:ssZ"
   */
  date: string;

  /** Nom d'affichage anonymisé ou pseudonyme de l'auteur */
  authorName?: string;
}

/**
 * Payload pour la soumission d'un nouvel avis.
 */
export type ReviewCreatePayload = Omit<Review, 'id' | 'date'>;

// ─────────────────────────────────────────────
// MODULE : WHATSAPP NOTIFICATIONS
// ─────────────────────────────────────────────

/**
 * Payload pour l'envoi d'une notification via WhatsApp.
 * Utilisé pour confirmer des réservations ou envoyer des récapitulatifs.
 */
export interface WhatsAppPayload {
  /**
   * Numéro de téléphone du destinataire au format international E.164.
   * Exemples valides : "+237612345678", "+237699887766"
   * Le préfixe pays (+237 pour le Cameroun) est obligatoire.
   */
  recipientPhone: string;

  /**
   * Corps du message à envoyer.
   * Longueur maximale : 4096 caractères (limite WhatsApp Business API).
   * Ne doit pas contenir d'informations sensibles (données bancaires, mots de passe).
   */
  message: string;

  /** Type de message pour le routage interne */
  messageType?: 'confirmation' | 'reminder' | 'budget_summary' | 'general';

  /** Identifiant de corrélation pour le suivi des envois */
  correlationId?: string;
}

/**
 * Réponse après tentative d'envoi WhatsApp.
 */
export interface WhatsAppSendResponse {
  /** Indique si le message a bien été soumis à l'API WhatsApp */
  success: boolean;

  /** Identifiant du message retourné par l'API WhatsApp (si succès) */
  messageId?: string;

  /** Message d'erreur en cas d'échec */
  errorMessage?: string;

  /** Timestamp de la tentative d'envoi (ISO 8601) */
  sentAt: string;
}

// ─────────────────────────────────────────────
// UTILITAIRES COMMUNS
// ─────────────────────────────────────────────

/**
 * Structure de réponse API standardisée pour toutes les routes.
 * @template T - Type des données retournées dans le champ `data`
 */
export interface ApiResponse<T = unknown> {
  /** Indique le succès ou l'échec de l'opération */
  success: boolean;

  /** Données retournées (présentes uniquement en cas de succès) */
  data?: T;

  /** Message descriptif (succès ou erreur) */
  message?: string;

  /** Code d'erreur métier (présent uniquement en cas d'erreur) */
  errorCode?: string;

  /** Timestamp de la réponse (ISO 8601) */
  timestamp: string;
}

/**
 * Structure d'erreur de validation de champ.
 */
export interface ValidationError {
  /** Nom du champ en erreur */
  field: string;

  /** Message d'erreur lisible */
  message: string;

  /** Valeur soumise (peut être omise pour des raisons de sécurité) */
  rejectedValue?: unknown;
}

/**
 * Paramètres de pagination pour les listes.
 */
export interface PaginationParams {
  /** Numéro de page (commence à 1) */
  page: number;

  /** Nombre d'éléments par page (max : 100) */
  limit: number;
}

/**
 * Métadonnées de pagination incluses dans les réponses de liste.
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Réponse paginée générique.
 * @template T - Type des éléments dans la liste
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

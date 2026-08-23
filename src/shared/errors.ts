/**
 * @file errors.ts
 * @description Hiérarchie des classes d'erreur métier pour E-Planner CMR.
 *              Toutes les erreurs métier doivent étendre AppError.
 *              Compatible avec TypeScript strict mode.
 */

import { ValidationError } from './types';

/**
 * Classe de base pour toutes les erreurs métier.
 * Étend Error et fournit une structure standardisée : message, statusCode, errorCode.
 */
export class AppError extends Error {
  /**
   * Crée une nouvelle instance d'erreur métier.
   *
   * @param message - Description lisible de l'erreur
   * @param statusCode - Code HTTP associé (200, 400, 401, 403, 404, 500, etc.)
   * @param errorCode - Identifiant machine de l'erreur (ex. 'VENDOR_NOT_FOUND')
   * @param errors - Tableau optionnel des erreurs de validation par champ
   */
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly errors?: ValidationError[]
  ) {
    super(message);
    // Restaure la prototypal chain pour TypeScript strict
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Erreur 404 — Ressource non trouvée.
 * Utilisée lorsqu'un identifiant valide ne correspond à aucune ressource en catalogue.
 */
export class NotFoundError extends AppError {
  /**
   * Crée une nouvelle erreur 404.
   *
   * @param resource - Nom de la ressource non trouvée (défaut : 'Ressource')
   *                  Exemple : 'Vendor', 'Venue', 'Review'
   */
  constructor(resource = 'Ressource') {
    super(
      `${resource} non trouvé`,
      404,
      'VENDOR_NOT_FOUND'
    );
  }
}

/**
 * Erreur 400 — Données de validation invalides.
 * Utilisée lorsque les données d'entrée ne respectent pas les règles de validation.
 */
export class ValidationAppError extends AppError {
  /**
   * Crée une nouvelle erreur de validation.
   *
   * @param errors - Tableau des erreurs de validation par champ
   */
  constructor(errors: ValidationError[]) {
    super(
      'Données de la requête invalides',
      400,
      'VALIDATION_ERROR',
      errors
    );
  }
}

/**
 * Erreur 401 — Authentification requise.
 * Utilisée lorsqu'une requête manque d'authentification ou le token est invalide.
 */
export class UnauthorizedError extends AppError {
  /**
   * Crée une nouvelle erreur 401.
   */
  constructor() {
    super(
      'Authentification requise',
      401,
      'UNAUTHORIZED'
    );
  }
}

/**
 * Erreur 403 — Accès refusé par manque de droits.
 * Utilisée lorsque le token d'authentification est valide mais le rôle est insuffisant (ex. non-admin).
 */
export class ForbiddenError extends AppError {
  /**
   * Crée une nouvelle erreur 403.
   */
  constructor() {
    super(
      'Droits insuffisants',
      403,
      'FORBIDDEN'
    );
  }
}

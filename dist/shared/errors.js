"use strict";
/**
 * @file errors.ts
 * @description Hiérarchie des classes d'erreur métier pour E-Planner CMR.
 *              Toutes les erreurs métier doivent étendre AppError.
 *              Compatible avec TypeScript strict mode.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationAppError = exports.NotFoundError = exports.AppError = void 0;
/**
 * Classe de base pour toutes les erreurs métier.
 * Étend Error et fournit une structure standardisée : message, statusCode, errorCode.
 */
class AppError extends Error {
    message;
    statusCode;
    errorCode;
    errors;
    /**
     * Crée une nouvelle instance d'erreur métier.
     *
     * @param message - Description lisible de l'erreur
     * @param statusCode - Code HTTP associé (200, 400, 401, 403, 404, 500, etc.)
     * @param errorCode - Identifiant machine de l'erreur (ex. 'VENDOR_NOT_FOUND')
     * @param errors - Tableau optionnel des erreurs de validation par champ
     */
    constructor(message, statusCode, errorCode, errors) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errors = errors;
        // Restaure la prototypal chain pour TypeScript strict
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
/**
 * Erreur 404 — Ressource non trouvée.
 * Utilisée lorsqu'un identifiant valide ne correspond à aucune ressource en catalogue.
 */
class NotFoundError extends AppError {
    /**
     * Crée une nouvelle erreur 404.
     *
     * @param resource - Nom de la ressource non trouvée (défaut : 'Ressource')
     *                  Exemple : 'Vendor', 'Venue', 'Review'
     */
    constructor(resource = 'Ressource') {
        super(`${resource} non trouvé`, 404, 'VENDOR_NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Erreur 400 — Données de validation invalides.
 * Utilisée lorsque les données d'entrée ne respectent pas les règles de validation.
 */
class ValidationAppError extends AppError {
    /**
     * Crée une nouvelle erreur de validation.
     *
     * @param errors - Tableau des erreurs de validation par champ
     */
    constructor(errors) {
        super('Données de la requête invalides', 400, 'VALIDATION_ERROR', errors);
    }
}
exports.ValidationAppError = ValidationAppError;
/**
 * Erreur 401 — Authentification requise.
 * Utilisée lorsqu'une requête manque d'authentification ou le token est invalide.
 */
class UnauthorizedError extends AppError {
    /**
     * Crée une nouvelle erreur 401.
     */
    constructor() {
        super('Authentification requise', 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Erreur 403 — Accès refusé par manque de droits.
 * Utilisée lorsque le token d'authentification est valide mais le rôle est insuffisant (ex. non-admin).
 */
class ForbiddenError extends AppError {
    /**
     * Crée une nouvelle erreur 403.
     */
    constructor() {
        super('Droits insuffisants', 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=errors.js.map
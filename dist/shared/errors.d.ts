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
export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly errorCode: string;
    readonly errors?: ValidationError[] | undefined;
    /**
     * Crée une nouvelle instance d'erreur métier.
     *
     * @param message - Description lisible de l'erreur
     * @param statusCode - Code HTTP associé (200, 400, 401, 403, 404, 500, etc.)
     * @param errorCode - Identifiant machine de l'erreur (ex. 'VENDOR_NOT_FOUND')
     * @param errors - Tableau optionnel des erreurs de validation par champ
     */
    constructor(message: string, statusCode: number, errorCode: string, errors?: ValidationError[] | undefined);
}
/**
 * Erreur 404 — Ressource non trouvée.
 * Utilisée lorsqu'un identifiant valide ne correspond à aucune ressource en catalogue.
 */
export declare class NotFoundError extends AppError {
    /**
     * Crée une nouvelle erreur 404.
     *
     * @param resource - Nom de la ressource non trouvée (défaut : 'Ressource')
     *                  Exemple : 'Vendor', 'Venue', 'Review'
     */
    constructor(resource?: string);
}
/**
 * Erreur 400 — Données de validation invalides.
 * Utilisée lorsque les données d'entrée ne respectent pas les règles de validation.
 */
export declare class ValidationAppError extends AppError {
    /**
     * Crée une nouvelle erreur de validation.
     *
     * @param errors - Tableau des erreurs de validation par champ
     */
    constructor(errors: ValidationError[]);
}
/**
 * Erreur 401 — Authentification requise.
 * Utilisée lorsqu'une requête manque d'authentification ou le token est invalide.
 */
export declare class UnauthorizedError extends AppError {
    /**
     * Crée une nouvelle erreur 401.
     */
    constructor();
}
/**
 * Erreur 403 — Accès refusé par manque de droits.
 * Utilisée lorsque le token d'authentification est valide mais le rôle est insuffisant (ex. non-admin).
 */
export declare class ForbiddenError extends AppError {
    /**
     * Crée une nouvelle erreur 403.
     */
    constructor();
}
//# sourceMappingURL=errors.d.ts.map
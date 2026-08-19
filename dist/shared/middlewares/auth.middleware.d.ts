/**
 * @file auth.middleware.ts
 * @description Middleware pour vérifier le token d'authentification administrateur.
 *              Appliqué sur les routes protégées (POST, PUT, DELETE /api/vendors).
 *              Valide le token fourni dans l'en-tête Authorization.
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Middleware requireAdmin
 *
 * Vérifie la présence et la validité du token administrateur dans l'en-tête Authorization.
 *
 * Comportement :
 * - Lit l'en-tête Authorization (insensible à la casse)
 * - Extrait le token après le préfixe "Bearer " (ex: "Bearer abc123" → "abc123")
 * - Compare le token avec process.env.ADMIN_TOKEN en utilisant === (égalité stricte)
 * - Si l'en-tête est absent ou le token vide : lève UnauthorizedError (401)
 * - Si le token ne correspond pas : lève ForbiddenError (403)
 * - Si le token correspond : appelle next()
 *
 * IMPORTANT : Le token n'est jamais loggué. Aucune valeur sensible n'est exposée.
 *
 * @param req - Objet Request Express
 * @param res - Objet Response Express
 * @param next - Fonction NextFunction Express
 * @throws UnauthorizedError si l'en-tête Authorization est absent ou le token est vide
 * @throws ForbiddenError si le token fourni ne correspond pas à process.env.ADMIN_TOKEN
 */
export declare const requireAdmin: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map
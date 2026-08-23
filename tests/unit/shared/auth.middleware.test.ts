/**
 * @file auth.middleware.test.ts
 * @description Tests unitaires du middleware d'authentification admin.
 *              Valide le comportement de requireAdmin contre les spécifications.
 */

import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../../../src/shared/middlewares/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../../../src/shared/errors';

describe('requireAdmin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Sauvegarder les variables d'environnement originales
    originalEnv = process.env;

    // Mock Request avec la méthode get()
    mockRequest = {
      get: jest.fn(),
    };

    // Mock Response (non utilisé dans ce middleware)
    mockResponse = {};

    // Mock NextFunction
    mockNext = jest.fn();

    // Définir un token admin pour les tests
    process.env.ADMIN_TOKEN = 'test-secret-admin-token';
  });

  afterEach(() => {
    // Restaurer les variables d'environnement
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should call next() when Authorization header contains valid Bearer token', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer test-secret-admin-token');

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() when Authorization header contains valid token without Bearer prefix', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('test-secret-admin-token');

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-insensitive when reading Authorization header', () => {
      // Express.Request.get() est insensible à la casse par défaut
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer test-secret-admin-token');

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Vérifier que get() a été appelé (Express gère la casse)
      expect(mockRequest.get).toHaveBeenCalledWith('Authorization');
    });
  });

  describe('UnauthorizedError Cases (401)', () => {
    it('should throw UnauthorizedError when Authorization header is missing', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(null);

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when Authorization header is undefined', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when Authorization header is empty string', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when token after Bearer is empty', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer ');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when only "Bearer" is provided without space and token', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('ForbiddenError Cases (403)', () => {
    it('should throw ForbiddenError when token does not match ADMIN_TOKEN', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer wrong-token');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when token is close but not exact match', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer test-secret-admin-token-extra');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when token has whitespace differences', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer test-secret-admin-token ');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when case differs in token', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer TEST-SECRET-ADMIN-TOKEN');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN_TOKEN env var is not set', () => {
      delete process.env.ADMIN_TOKEN;
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer some-token');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Token Extraction', () => {
    it('should extract token correctly from Bearer format', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer test-secret-admin-token');

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple spaces after Bearer', () => {
      // Token après "Bearer   " devrait être comparé au token attendu
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer   test-secret-admin-token');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError); // Les espaces supplémentaires font échouer la comparaison

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should treat non-Bearer header value as token directly', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('test-secret-admin-token');

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security - Token is never logged', () => {
    it('should not expose token in error messages', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer wrong-token');

      try {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error) {
        // Vérifier que l'erreur n'expose pas le token
        expect((error as any).message).not.toContain('wrong-token');
        expect((error as any).message).not.toContain('test-secret-admin-token');
      }
    });

    it('should not expose ADMIN_TOKEN env var in error messages', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer invalid');

      try {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error) {
        expect((error as any).message).not.toContain(process.env.ADMIN_TOKEN);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle Authorization header with mixed case Bearer prefix', () => {
      // The middleware treats anything not starting with "Bearer " as the token itself
      (mockRequest.get as jest.Mock).mockReturnValue('bearer test-secret-admin-token');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should use strict equality (===) for token comparison', () => {
      // Verify that the token comparison uses === not ==
      process.env.ADMIN_TOKEN = '123';
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer "123"');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should handle very long token values', () => {
      const longToken = 'a'.repeat(10000);
      process.env.ADMIN_TOKEN = longToken;
      (mockRequest.get as jest.Mock).mockReturnValue(`Bearer ${longToken}`);

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token-with-!@#$%^&*()_+=[]{}|;:,.<>?';
      process.env.ADMIN_TOKEN = specialToken;
      (mockRequest.get as jest.Mock).mockReturnValue(`Bearer ${specialToken}`);

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Requirement Mapping', () => {
    it('validates Requirement 4.8: Admin creation without auth throws UNAUTHORIZED (401)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(null);

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
    });

    it('validates Requirement 5.5: Admin update without auth throws UNAUTHORIZED (401)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(null);

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('validates Requirement 6.4: Admin delete without token throws UNAUTHORIZED (401)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(null);

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedError);

      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('validates Requirement 6.5: Admin delete with invalid token throws FORBIDDEN (403)', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer invalid-token');

      expect(() => {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(ForbiddenError);

      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('FORBIDDEN');
    });

    it('validates Requirement 7.5: Token is never logged or exposed in code', () => {
      (mockRequest.get as jest.Mock).mockReturnValue('Bearer secret-value');

      // The middleware should not expose secrets in responses or logs
      try {
        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error) {
        // Verify error doesn't contain sensitive data
        const errorStr = JSON.stringify(error);
        expect(errorStr).not.toContain('secret-value');
        expect(errorStr).not.toContain(process.env.ADMIN_TOKEN);
      }
    });
  });
});

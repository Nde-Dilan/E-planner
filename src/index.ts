/**
 * @file index.ts
 * @description Point d'entrée principal du serveur Express E-Planner CMR.
 *              Configure les middlewares de sécurité, CORS, rate-limiting, et les routes.
 */

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApiResponse } from './shared/types';
import { vendorRouter } from './modules/vendors';
import { errorMiddleware } from './shared/middlewares/error.middleware';

// ─────────────────────────────────────────────────────────────
// Configuration & Initialisation
// ─────────────────────────────────────────────────────────────

const app: Express = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────
// Middlewares de Sécurité
// ─────────────────────────────────────────────────────────────

// Helmet : sécurise les headers HTTP
app.use(helmet());

// CORS : contrôle les origines autorisées
const corsOptions = {
  origin: CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 heures
};
app.use(cors(corsOptions));

// Rate Limiting : limite les requêtes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
  standardHeaders: true, // Retourne l'info dans `RateLimit-*` headers
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skip: (req: Request): boolean => {
    // Skip rate limiting pour les routes de santé en développement
    return NODE_ENV === 'development' && req.path === '/api/health';
  },
});
app.use(limiter);

// ─────────────────────────────────────────────────────────────
// Middlewares de Parsing
// ─────────────────────────────────────────────────────────────

// Parse JSON avec limite de taille
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ─────────────────────────────────────────────────────────────
// Middleware de Logging Simple
// ─────────────────────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || 'unknown';

  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  next();
});

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

/**
 * Route de santé (health check)
 * Endpoint : GET /api/health
 * Retourne le statut du serveur avec timestamp
 */
app.get('/api/health', (_req: Request, res: Response): void => {
  const response: ApiResponse<{ uptime: number; environment: string }> = {
    success: true,
    data: {
      uptime: process.uptime(),
      environment: NODE_ENV,
    },
    message: 'E-Planner CMR API is running',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

/**
 * Route racine (/)
 * Redirect vers /api/health ou message de bienvenue
 */
app.get('/', (_req: Request, res: Response): void => {
  const response: ApiResponse<{ version: string }> = {
    success: true,
    data: {
      version: '1.0.0',
    },
    message: 'Bienvenue sur E-Planner CMR API',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

/**
 * Route de documentation API
 * Endpoint : GET /api/docs
 */
app.get('/api/docs', (_req: Request, res: Response): void => {
  const response: ApiResponse<{ endpoints: string[] }> = {
    success: true,
    data: {
      endpoints: [
        'GET /api/health',
        'GET /api/docs',
        'POST /api/venues',
        'GET /api/venues',
        'POST /api/vendors',
        'GET /api/vendors',
        'GET /api/vendors/:id',
        'POST /api/vendors/:id/quote',
        'PUT /api/vendors/:id',
        'DELETE /api/vendors/:id',
        'POST /api/budget/estimate',
        'POST /api/reviews',
        'GET /api/reviews',
      ],
    },
    message: 'Documentation des endpoints E-Planner CMR',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

// ─────────────────────────────────────────────────────────────
// Module Routes
// ─────────────────────────────────────────────────────────────

/**
 * Vendors Module Router
 * Endpoint : /api/vendors
 * Handles all vendor-related operations (search, detail, quotes, CRUD)
 */
app.use('/api/vendors', vendorRouter);

// ─────────────────────────────────────────────────────────────
// Route 404
// ─────────────────────────────────────────────────────────────

app.use((req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Endpoint non trouvé: ${req.method} ${req.path}`,
    errorCode: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

// ─────────────────────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Error middleware must be registered as the LAST middleware
 * to catch all errors thrown during request processing.
 * It standardizes error responses and masks sensitive information in production.
 */
app.use(errorMiddleware);

// ─────────────────────────────────────────────────────────────
// Démarrage du serveur
// ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, (): void => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║        E-Planner CMR API - Serveur Actif             ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  🚀 Port            : ${PORT.toString().padEnd(39)}║`);
  console.log(`║  🔧 Environment     : ${NODE_ENV.padEnd(39)}║`);
  console.log(`║  🌐 CORS Origin     : ${CORS_ORIGIN.padEnd(39)}║`);
  console.log('║  📋 Routes :                                         ║');
  console.log('║     - GET  /                                        ║');
  console.log('║     - GET  /api/health                              ║');
  console.log('║     - GET  /api/docs                                ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  ⏱️  Démarré le : ${new Date().toISOString().padEnd(38)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');
});

// ─────────────────────────────────────────────────────────────
// Gestion des signaux de fermeture gracieuse
// ─────────────────────────────────────────────────────────────

const gracefulShutdown = (signal: string): void => {
  console.log(`\n📍 Signal reçu: ${signal}`);
  console.log('⏸️  Fermeture gracieuse du serveur...');

  server.close((): void => {
    console.log('✅ Serveur fermé proprement.');
    process.exit(0);
  });

  // Force la fermeture après 10 secondes
  setTimeout((): void => {
    console.error('❌ Fermeture forcée après timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des promesses non rejetées
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // En production, envoyer une alerte
});

// Gestion des exceptions non attrapées
process.on('uncaughtException', (error: Error): void => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

export default app;

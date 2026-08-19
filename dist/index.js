"use strict";
/**
 * @file index.ts
 * @description Point d'entrée principal du serveur Express E-Planner CMR.
 *              Configure les middlewares de sécurité, CORS, rate-limiting, et les routes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ─────────────────────────────────────────────────────────────
// Configuration & Initialisation
// ─────────────────────────────────────────────────────────────
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
// ─────────────────────────────────────────────────────────────
// Middlewares de Sécurité
// ─────────────────────────────────────────────────────────────
// Helmet : sécurise les headers HTTP
app.use((0, helmet_1.default)());
// CORS : contrôle les origines autorisées
const corsOptions = {
    origin: CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 heures
};
app.use((0, cors_1.default)(corsOptions));
// Rate Limiting : limite les requêtes par IP
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par IP
    message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
    standardHeaders: true, // Retourne l'info dans `RateLimit-*` headers
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
    skip: (req) => {
        // Skip rate limiting pour les routes de santé en développement
        return NODE_ENV === 'development' && req.path === '/api/health';
    },
});
app.use(limiter);
// ─────────────────────────────────────────────────────────────
// Middlewares de Parsing
// ─────────────────────────────────────────────────────────────
// Parse JSON avec limite de taille
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ limit: '10kb', extended: true }));
// ─────────────────────────────────────────────────────────────
// Middleware de Logging Simple
// ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
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
app.get('/api/health', (_req, res) => {
    const response = {
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
app.get('/', (_req, res) => {
    const response = {
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
app.get('/api/docs', (_req, res) => {
    const response = {
        success: true,
        data: {
            endpoints: [
                'GET /api/health',
                'GET /api/docs',
                'POST /api/venues',
                'GET /api/venues',
                'POST /api/vendors',
                'GET /api/vendors',
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
// Route 404
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    const response = {
        success: false,
        message: `Endpoint non trouvé: ${req.method} ${req.path}`,
        errorCode: 'ROUTE_NOT_FOUND',
        timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
});
// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────
app.use((err, _req, res, 
// next n'est pas utilisé mais est requis pour la signature d'error middleware
_next) => {
    const statusCode = err.statusCode || 500;
    const isDevelopment = NODE_ENV === 'development';
    // Log l'erreur complète en développement seulement
    if (isDevelopment) {
        console.error('Error:', err);
    }
    else {
        console.error('Error:', err.message);
    }
    const response = {
        success: false,
        message: isDevelopment ? err.message : 'Une erreur serveur est survenue',
        errorCode: err.code || 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
});
// ─────────────────────────────────────────────────────────────
// Démarrage du serveur
// ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
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
const gracefulShutdown = (signal) => {
    console.log(`\n📍 Signal reçu: ${signal}`);
    console.log('⏸️  Fermeture gracieuse du serveur...');
    server.close(() => {
        console.log('✅ Serveur fermé proprement.');
        process.exit(0);
    });
    // Force la fermeture après 10 secondes
    setTimeout(() => {
        console.error('❌ Fermeture forcée après timeout.');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Gestion des promesses non rejetées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // En production, envoyer une alerte
});
// Gestion des exceptions non attrapées
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map
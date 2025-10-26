import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import history from "connect-history-api-fallback";
import perplexityRoutes from "./routes/perplexity";
import { printVerificationInfo } from "./utils/verification-info";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration to allow requests from medicohelp.com.br
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://www.medicohelp.com.br',
    'https://www.medicohelp.com.br',
    'http://medicohelp.com.br',
    'https://medicohelp.com.br',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
  
  const origin = req.headers.origin;
  
  // Permitir origins da lista OU qualquer subdomínio de medicohelp.com.br
  if (origin && (allowedOrigins.includes(origin) || origin.includes('medicohelp.com.br'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Se não tem origin (requisições server-side), permite
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Force no-cache headers to prevent aggressive caching
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Rate limiter: 10 requests per day for most /api routes
// Skip /api/tools/* routes as they have their own rate limiting (60 req/hour per tool)
const apiRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/tools"),
  handler: (_req, res) => {
    res.status(429).json({ 
      message: "Limite diário de 10 consultas atingido. Tente novamente amanhã." 
    });
  }
});

app.use("/api/", apiRateLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Register Perplexity Médico routes
  app.use(perplexityRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // SPA fallback: serve index.html for all non-API routes
  // This must come before Vite setup to ensure proper routing
  app.use(history({
    rewrites: [
      // Don't rewrite Vite dev server paths
      { from: /^\/@vite\/.*$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/@react-refresh$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/@fs\/.*$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/@id\/.*$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/node_modules\/.*$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/src\/.*$/, to: (context: any) => context.parsedUrl.path },
      // Don't rewrite API routes
      { from: /^\/api\/.*$/, to: (context: any) => context.parsedUrl.path },
      // Don't rewrite auth routes
      { from: /^\/auth\/.*$/, to: (context: any) => context.parsedUrl.path },
      // Don't rewrite user routes
      { from: /^\/users\/.*$/, to: (context: any) => context.parsedUrl.path },
      // Don't rewrite static assets
      { from: /^\/static\/.*$/, to: (context: any) => context.parsedUrl.path },
      { from: /^\/assets\/.*$/, to: (context: any) => context.parsedUrl.path },
      // Don't rewrite uploads
      { from: /^\/uploads\/.*$/, to: (context: any) => context.parsedUrl.path },
    ],
  }));

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Print verification code info
      const baseUrl = process.env.OAUTH_BASE_URL || `http://localhost:${port}`;
      printVerificationInfo(baseUrl);
    },
  );
})();

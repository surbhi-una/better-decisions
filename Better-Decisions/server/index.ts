import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { auth } from "./auth";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Parse body FIRST before auth middleware
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Add better-auth middleware AFTER body parsing
app.all("/api/auth/*", async (req, res) => {
  console.log(`[AUTH] ${req.method} ${req.url}`);
  console.log(`[AUTH] Body:`, JSON.stringify(req.body));
  console.log(`[AUTH] Headers:`, req.headers['content-type']);
  try {
    // Construct full URL for better-auth
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${req.url}`;
    console.log(`[AUTH] Full URL: ${fullUrl}`);

    // Create a new request object with the full URL
    let bodyInit = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      bodyInit = JSON.stringify(req.body);
      console.log(`[AUTH] Sending body:`, bodyInit);
    }

    const authReq = new Request(fullUrl, {
      method: req.method,
      headers: {
        ...req.headers as HeadersInit,
        'content-type': 'application/json',
      },
      body: bodyInit,
    });

    const authRes = await auth.handler(authReq);
    console.log(`[AUTH] Response status: ${authRes.status}`);

    // Convert better-auth Response to Express response
    res.status(authRes.status);
    authRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await authRes.text();
    if (authRes.status >= 400) {
      console.log(`[AUTH] Error response:`, body);
    }
    res.send(body);
  } catch (error: any) {
    console.error('[AUTH] Handler error:', error.message);
    res.status(500).json({ error: 'Authentication error' });
  }
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

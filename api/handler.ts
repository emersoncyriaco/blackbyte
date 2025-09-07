// This file handles all API requests in Vercel
import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

// Create a single app instance
let appInstance: express.Express | null = null;

async function getApp(): Promise<express.Express> {
  if (appInstance) {
    return appInstance;
  }

  console.log('Initializing Express app for Vercel...');
  
  const app = express();
  
  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  
  // Add CORS for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  try {
    // Create mock server for routes registration
    const mockServer = createServer(app);
    
    // Register all routes
    await registerRoutes(app);
    console.log('Routes registered successfully');
    
    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('API Error:', err);
      
      if (!res.headersSent) {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ 
          message,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
      }
    });

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    appInstance = app;
    console.log('App initialized successfully');
    return app;
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server configuration error'
      });
    }
  }
}

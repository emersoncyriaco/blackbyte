import express from "express";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let appInstance: any = null;

async function initializeApp() {
  if (appInstance) return appInstance;
  
  const server = await registerRoutes(app);
  
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // For production, serve static files
  serveStatic(app);
  
  appInstance = app;
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await initializeApp();
  return app(req, res);

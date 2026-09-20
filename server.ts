import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";
import { apiRouter } from "./src/server/routes/api";
import { logger } from "./src/utils/logger";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Real-time Collaboration Engine (Observability Enabled)
  io.on("connection", (socket) => {
    logger.info(`Client connected to workspace stream`, { module: "WebSockets", socketId: socket.id });
    
    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);
      socket.to(workspaceId).emit("user-joined", socket.id);
      logger.debug(`User joined collaboration room`, { module: "WebSockets", workspaceId, socketId: socket.id });
    });

    socket.on("cursor-move", (data) => {
      socket.to(data.workspaceId).emit("cursor-update", {
        userId: socket.id,
        ...data
      });
    });

    socket.on("document-update", (data) => {
      socket.to(data.workspaceId).emit("document-changed", data);
    });
    
    socket.on("chat-message", (data) => {
      socket.to(data.workspaceId).emit("new-chat-message", data);
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected from workspace stream`, { module: "WebSockets", socketId: socket.id });
    });
  });

  // Security Hardening via Helmet with custom adjustments
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Enabling
  app.use(cors());

  // Observability & Request Auditing
  if (process.env.NODE_ENV === "production") {
    app.use(morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim(), { module: "HTTP-Access" })
      }
    }));
  } else {
    app.use(morgan("dev"));
  }

  app.use(express.json({ limit: "10mb" }));

  // Gateway Routes
  app.use("/api/v1", apiRouter);

  // Fallback API v2 Placeholder Route (Future extensibility)
  app.use("/api/v2", (req, res) => {
    res.status(501).json({
      error: "Not Implemented",
      message: "Version 2 APIs are currently under active specification."
    });
  });

  // Vite middleware for development (UI Layer)
  if (process.env.NODE_ENV !== "production") {
    logger.info("Initializing Vite development engine middleware...", { module: "Bundler" });
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Cloud-native production deployment folder serving
    logger.info("Configuring production static assets path serving", { module: "Bundler" });
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`Shadow Harvest CTI initialized successfully`, { 
      module: "Bootstrap", 
      port: PORT, 
      host: "0.0.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });
}

startServer();

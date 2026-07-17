import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";

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

  // Real-time Collaboration Engine
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);
      socket.to(workspaceId).emit("user-joined", socket.id);
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
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // Modernization: Strengthened security & observability
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite development
  }));
  app.use(cors());
  app.use(morgan("dev", {
    skip: (req, res) => res.statusCode < 400
  })); // Observability / Request Logging (Errors only)
  app.use(express.json());

  // Modernization: Extensible, versioned interfaces (API Layer)
  const apiV1 = express.Router();
  
  apiV1.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      message: "API Gateway Operational"
    });
  });

  // Example microservice route structure
  apiV1.get("/observability/metrics", (req, res) => {
    res.json({
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      status: "healthy"
    });
  });

  app.use("/api/v1", apiV1);

  // Vite middleware for development (UI Layer)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Cloud-native production deployment fallback
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[System] Service-oriented backend initialized on port ${PORT}`);
    console.log(`[System] API v1 Gateway accessible at /api/v1/health`);
  });
}

startServer();

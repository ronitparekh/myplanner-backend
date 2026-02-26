// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { startScheduler } from './services/scheduler.js';



dotenv.config();

connectDB()
startScheduler();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://myplanner-ronit.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const isAllowedDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const port = Number(url.port);

    // Vite dev server commonly uses 5173 and will auto-increment.
    return isLocalhost && port >= 5170 && port <= 5199;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl/postman) that send no Origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (process.env.NODE_ENV !== "production" && isAllowedDevOrigin(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

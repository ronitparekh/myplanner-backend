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

app.use(cors({
  origin: "https://myplanner-ronit.vercel.app", // ✅ your deployed frontend
  credentials: true
}));

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

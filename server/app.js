import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

// Database
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.route.js";
import modelRoutes from "./routes/models.route.js";
import partRoutes from "./routes/parts.route.js";
import plantRoutes from "./routes/plants.route.js";
import userRoutes from "./routes/users.route.js";
import productionEntryRoutes from "./routes/production.route.js";

// Master Routes
import defectTypeRoutes from "./routes/defects.route.js";
import downtimeReasonRoutes from "./routes/downTime.route.js";
import consumableTypeRoutes from "./routes/consumable.route.js";



// Connect Database
await connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Logger
app.use((req, res, next) => {
  console.log(`METHOD : ${req.method} | URL : ${req.url}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);

app.use("/api", modelRoutes);
app.use("/api", partRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/production-entry", productionEntryRoutes);

// Master Routes
app.use("/api/master/defect-types", defectTypeRoutes);
app.use("/api/master/downtime-reasons", downtimeReasonRoutes);
app.use("/api/master/consumable-types", consumableTypeRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Paint Shop MIS API Running Successfully",
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

// Server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});
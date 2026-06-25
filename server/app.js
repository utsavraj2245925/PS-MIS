import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoute.js";


import connectDB from "./config/db.js";
import partRoutes from "./routes/partRoutes.js";
import modelRoutes from "./routes/modelRoutes.js";
import plantRoutes from "./routes/plantRoute.js";
import userRoutes from "./routes/userRoute.js";
import productionEntryRoutes from "./routes/productionEntryRoutes.js";
import cookieParser from "cookie-parser";
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// Middleware
app.use(cookieParser())
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("METHOD : ", req.method, "| URL : ", req.url);
  next(); // ← don't forget this, without it every request will hang
});

// Routes

app.use("/api", modelRoutes);
app.use("/api", partRoutes);
app.use("/api", plantRoutes);
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", productionEntryRoutes);




// Server Start
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});


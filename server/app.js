import express from "express";
import cors from "cors";
import dotenv from "dotenv";


import connectDB from "./config/db.js";
import partRoutes from "./routes/partRoutes.js";
import modelRoutes from "./routes/modelRoutes.js";
import plantRoutes from "./routes/plantRoute.js";
import userRoutes from "./routes/userRoute.js";
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "https://hoppscotch.io"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Routes

app.use("/api", modelRoutes);

app.use("/api", partRoutes);

app.use("/api", plantRoutes);

app.use("/api", userRoutes);




// Server Start
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});


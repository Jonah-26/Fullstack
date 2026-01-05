import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import dashboardRoutes from "./routes/dashboard.routes.js";

import employeeRoutes from "./routes/employee.routes.js";
import employmentRoutes from "./routes/employment.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import promotionRoutes from "./routes/promotion.routes.js";
import credentialRoutes from "./routes/credential.routes.js";
import leaveCreditRoutes from "./routes/leaveCredit.routes.js";
import leaveRequestRoutes from "./routes/leaveRequest.routes.js";


import authRoutes from "./routes/auth.routes.js";
import { requireAuth } from "./middleware/authMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);


app.use("/api/employees", requireAuth, employeeRoutes);
app.use("/api/employment", requireAuth, employmentRoutes);
app.use("/api/salary", requireAuth, salaryRoutes);
app.use("/api/promotion", requireAuth, promotionRoutes);
app.use("/api/credential", requireAuth, credentialRoutes);
app.use("/api/leave-credit", requireAuth, leaveCreditRoutes);
app.use("/api/leave-request", requireAuth, leaveRequestRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);



// Health check
app.get("/", (req, res) => {
  res.send("HR Backend API is running");
});

// MongoDB connection
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hr_db";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Swagger config (fix apis path)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HR Backend API",
      version: "1.0.0",
      description:
        "API for managing employees, employment, salary, promotions, and credentials",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], 
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error handler LAST
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

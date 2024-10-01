import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import setUpRoutes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

setUpRoutes(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

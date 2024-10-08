import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import setUpRoutes from "./routes/index.js";
import fileUpload from "express-fileupload";
// import { socketIo } from "socket.io";

dotenv.config();

const app = express();

// const io = socketIo();

app.use(express.json());
app.use(cors());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

connectDB();

setUpRoutes(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

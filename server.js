// // import express from "express";
// // import dotenv from "dotenv";
// // import cors from "cors";
// // import connectDB from "./config/db.js";
// // import setUpRoutes from "./routes/index.js";
// // import fileUpload from "express-fileupload";
// // import { Server } from "socket.io";
// // import http from "http";

// // dotenv.config();

// // const app = express();

// // const server = http.createServer(app);

// // app.use(express.json());
// // app.use(cors());

// // app.use(
// //   fileUpload({
// //     useTempFiles: true,
// //     tempFileDir: "/tmp/",
// //     limits: { fileSize: 5 * 1024 * 1024 },
// //   })
// // );

// // connectDB();

// // setUpRoutes(app);

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });

// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";
// import setUpRoutes from "./routes/index.js";
// import fileUpload from "express-fileupload";
// import { Server } from "socket.io";
// import http from "http";

// dotenv.config();

// const app = express();

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Change this to your frontend URL in production for better security
//     methods: ["GET", "POST"],
//   },
// });

// // Socket.IO connection handling
// io.on("connection", (socket) => {
//   console.log("New client connected", socket.id);

//   // Handle socket events here
//   socket.on("join", (userId) => {
//     socket.join(userId);
//     console.log(`User with ID ${userId} joined their room.`);
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected", socket.id);
//   });
// });

// app.use(express.json());
// app.use(cors());

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//     limits: { fileSize: 5 * 1024 * 1024 },
//   })
// );

// // Connect to the database
// connectDB();

// // Set up all routes
// setUpRoutes(app);

// // Start the server on the specified port
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// export { io }; // Exporting the io instance for other files to use (e.g., in your controllers)

import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import setUpRoutes from "./routes/index.js";
import fileUpload from "express-fileupload";
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();

// CORS setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Allow credentials (important for withCredentials: true)
  })
);

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Same here, allowing credentials
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User with ID ${userId} joined their room.`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

app.use(express.json());

// File upload setup
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

// Connect to the database
connectDB();

// Set up all routes
setUpRoutes(app);

// Start the server on the specified port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

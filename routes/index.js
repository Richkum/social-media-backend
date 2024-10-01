import authRoutes from "./authRoutes.js";
// import postRoutes from "./postRoutes.js";
// import userRoutes from "./userRoutes.js";

const setUpRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  // app.use("/api/posts", postRoutes);
  // app.use("/api/users", userRoutes);
};

export default setUpRoutes;

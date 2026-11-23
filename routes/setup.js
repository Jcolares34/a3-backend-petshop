import indexRouter from "./index.js";
import authRouter from "./auth.js";
import tutoresRouter from "./tutores.js";
import petsRouter from "./pets.js";
import consultasRouter from "./consultas.js";
import { tokenMiddleware } from "../utils/index.js";

// Monta todas as rotas da API; as de CRUD exigem token
const setRotas = (app) => {
  app.use("/", indexRouter);
  app.use("/auth", authRouter);
  app.use("/tutores", tokenMiddleware, tutoresRouter);
  app.use("/pets", tokenMiddleware, petsRouter);
  app.use("/consultas", tokenMiddleware, consultasRouter);
};

export { setRotas };

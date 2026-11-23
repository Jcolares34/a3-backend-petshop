import express from "express";
import { tokenMiddleware } from "../utils/index.js";
import { exigirFirebase, cadastrar, login, eu, conferirToken } from "../controllers/authController.js";

const authRouter = express.Router();

// Cada rota só chama o controller, que faz o trabalho
authRouter.use(exigirFirebase);
authRouter.post("/cadastro", cadastrar);
authRouter.post("/login", login);
authRouter.get("/eu", tokenMiddleware, eu);
authRouter.get("/token", tokenMiddleware, conferirToken);

export default authRouter;

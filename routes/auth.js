import express from "express";
import { tokenMiddleware } from "../utils/index.js";
import { exigirFirebase, cadastrar, login, eu, conferirToken } from "../controllers/authController.js";
import { capturar } from "../utils/erros.js";

const authRouter = express.Router();

// Cada rota só chama o controller; o capturar leva os erros ao tratador do app.js
authRouter.use(exigirFirebase);
authRouter.post("/cadastro", capturar(cadastrar));
authRouter.post("/login", capturar(login));
authRouter.get("/eu", tokenMiddleware, capturar(eu));
authRouter.get("/token", tokenMiddleware, conferirToken);

export default authRouter;

import express from "express";
import {
  listarConsultas,
  criarConsulta,
  buscarConsulta,
  alterarConsulta,
  excluirConsulta,
} from "../controllers/consultasController.js";
import { capturar } from "../utils/erros.js";

const consultasRouter = express.Router();

// Cada rota só chama o controller; o capturar leva os erros ao tratador do app.js
consultasRouter.get("/", capturar(listarConsultas));
consultasRouter.post("/", capturar(criarConsulta));
consultasRouter.get("/:id", capturar(buscarConsulta));
consultasRouter.put("/:id", capturar(alterarConsulta));
consultasRouter.delete("/:id", capturar(excluirConsulta));

export default consultasRouter;

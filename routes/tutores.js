import express from "express";
import {
  listarTutores,
  criarTutor,
  buscarTutor,
  listarPetsDoTutor,
  alterarTutor,
  excluirTutor,
} from "../controllers/tutoresController.js";
import { capturar } from "../utils/erros.js";

const tutoresRouter = express.Router();

// Cada rota só chama o controller; o capturar leva os erros ao tratador do app.js
tutoresRouter.get("/", capturar(listarTutores));
tutoresRouter.post("/", capturar(criarTutor));
tutoresRouter.get("/:id", capturar(buscarTutor));
tutoresRouter.get("/:id/pets", capturar(listarPetsDoTutor));
tutoresRouter.put("/:id", capturar(alterarTutor));
tutoresRouter.delete("/:id", capturar(excluirTutor));

export default tutoresRouter;

import express from "express";
import {
  listarTutores,
  criarTutor,
  buscarTutor,
  listarPetsDoTutor,
  alterarTutor,
  excluirTutor,
} from "../controllers/tutoresController.js";

const tutoresRouter = express.Router();

// Cada rota só chama o controller, que faz o trabalho
tutoresRouter.get("/", listarTutores);
tutoresRouter.post("/", criarTutor);
tutoresRouter.get("/:id", buscarTutor);
tutoresRouter.get("/:id/pets", listarPetsDoTutor);
tutoresRouter.put("/:id", alterarTutor);
tutoresRouter.delete("/:id", excluirTutor);

export default tutoresRouter;

import express from "express";
import {
  listarConsultas,
  criarConsulta,
  buscarConsulta,
  alterarConsulta,
  excluirConsulta,
} from "../controllers/consultasController.js";

const consultasRouter = express.Router();

// Cada rota só chama o controller, que faz o trabalho
consultasRouter.get("/", listarConsultas);
consultasRouter.post("/", criarConsulta);
consultasRouter.get("/:id", buscarConsulta);
consultasRouter.put("/:id", alterarConsulta);
consultasRouter.delete("/:id", excluirConsulta);

export default consultasRouter;

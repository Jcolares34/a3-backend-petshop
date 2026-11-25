import express from "express";
import {
  listarPets,
  criarPet,
  buscarPet,
  listarConsultasDoPet,
  alterarPet,
  excluirPet,
} from "../controllers/petsController.js";
import { capturar } from "../utils/erros.js";

const petsRouter = express.Router();

// Cada rota só chama o controller; o capturar leva os erros ao tratador do app.js
petsRouter.get("/", capturar(listarPets));
petsRouter.post("/", capturar(criarPet));
petsRouter.get("/:id", capturar(buscarPet));
petsRouter.get("/:id/consultas", capturar(listarConsultasDoPet));
petsRouter.put("/:id", capturar(alterarPet));
petsRouter.delete("/:id", capturar(excluirPet));

export default petsRouter;

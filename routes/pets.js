import express from "express";
import {
  listarPets,
  criarPet,
  buscarPet,
  listarConsultasDoPet,
  alterarPet,
  excluirPet,
} from "../controllers/petsController.js";

const petsRouter = express.Router();

// Cada rota só chama o controller, que faz o trabalho
petsRouter.get("/", listarPets);
petsRouter.post("/", criarPet);
petsRouter.get("/:id", buscarPet);
petsRouter.get("/:id/consultas", listarConsultasDoPet);
petsRouter.put("/:id", alterarPet);
petsRouter.delete("/:id", excluirPet);

export default petsRouter;

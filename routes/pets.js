import express from "express";
import prisma from "../utils/prisma.js";
import { lerId, especies, validarPet } from "../utils/validacao.js";
import { formatarConsulta, camposConsulta } from "../controllers/consultasController.js";

const petsRouter = express.Router();

// Campos devolvidos nas respostas
const camposPet = {
  id: true,
  nome: true,
  especie: true,
  raca: true,
  dataNascimento: true,
  peso: true,
  tutorId: true,
  criadoEm: true,
};

// Peso como número e data de nascimento como AAAA-MM-DD
const formatarPet = (pet) => ({
  ...pet,
  peso: pet.peso === null ? null : Number(pet.peso),
  dataNascimento: pet.dataNascimento ? pet.dataNascimento.toISOString().slice(0, 10) : null,
});

// O pet é do usuário quando o tutor dele é do usuário
const buscarPet = (id, usuarioId, select = camposPet) =>
  prisma.pet.findFirst({ where: { id, tutor: { usuarioId } }, select });

const tutorDoUsuario = (tutorId, usuarioId) =>
  prisma.tutor.findFirst({ where: { id: tutorId, usuarioId }, select: { id: true } });

// Lista os pets do usuário, com filtros opcionais ?especie= e ?tutorId=
petsRouter.get("/", async (req, res, next) => {
  const where = { tutor: { usuarioId: req.usuario.id } };
  const { especie, tutorId } = req.query;
  if (especie !== undefined) {
    if (typeof especie !== "string" || !especies.includes(especie.trim().toLowerCase())) {
      return res.status(400).json({ erro: `especie deve ser: ${especies.join(", ")}` });
    }
    where.especie = especie.trim().toLowerCase();
  }
  if (tutorId !== undefined) {
    if (!/^\d+$/.test(String(tutorId)) || Number(tutorId) <= 0) {
      return res.status(400).json({ erro: "tutorId deve ser um número inteiro" });
    }
    where.tutorId = Number(tutorId);
  }
  try {
    const pets = await prisma.pet.findMany({ where, select: camposPet, orderBy: { nome: "asc" } });
    res.json(pets.map(formatarPet));
  } catch (error) {
    next(error);
  }
});

// Cria um pet para um tutor do usuário
petsRouter.post("/", async (req, res, next) => {
  const { erro, dados } = validarPet(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    if (!(await tutorDoUsuario(dados.tutorId, req.usuario.id))) {
      return res.status(404).json({ erro: "Tutor não encontrado" });
    }
    const pet = await prisma.pet.create({ data: dados, select: camposPet });
    res.status(201).json(formatarPet(pet));
  } catch (error) {
    next(error);
  }
});

// Busca um pet, com o nome do tutor
petsRouter.get("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const pet = await buscarPet(id, req.usuario.id, {
      ...camposPet,
      tutor: { select: { id: true, nome: true } },
    });
    if (!pet) return res.status(404).json({ erro: "Pet não encontrado" });
    res.json(formatarPet(pet));
  } catch (error) {
    next(error);
  }
});

// Histórico de consultas do pet, da mais recente para a mais antiga
petsRouter.get("/:id/consultas", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    if (!(await buscarPet(id, req.usuario.id, { id: true }))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    const consultas = await prisma.consulta.findMany({
      where: { petId: id },
      select: camposConsulta,
      orderBy: { dataHora: "desc" },
    });
    res.json(consultas.map(formatarConsulta));
  } catch (error) {
    next(error);
  }
});

// Altera só os campos enviados; o novo tutor também precisa ser do usuário
petsRouter.put("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  const { erro, dados } = validarPet(req.body, true);
  if (erro) return res.status(400).json({ erro });
  try {
    if (!(await buscarPet(id, req.usuario.id, { id: true }))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    if (dados.tutorId && !(await tutorDoUsuario(dados.tutorId, req.usuario.id))) {
      return res.status(404).json({ erro: "Tutor não encontrado" });
    }
    const pet = await prisma.pet.update({ where: { id }, data: dados, select: camposPet });
    res.json(formatarPet(pet));
  } catch (error) {
    next(error);
  }
});

// Exclui; bloqueia se o pet tiver consultas
petsRouter.delete("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const pet = await buscarPet(id, req.usuario.id, { _count: { select: { consultas: true } } });
    if (!pet) return res.status(404).json({ erro: "Pet não encontrado" });
    if (pet._count.consultas > 0) {
      return res.status(409).json({ erro: "Pet possui consultas cadastradas" });
    }
    await prisma.pet.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    if (error.code === "P2003") return res.status(409).json({ erro: "Pet possui consultas cadastradas" });
    next(error);
  }
});

export { formatarPet, camposPet };
export default petsRouter;

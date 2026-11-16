import express from "express";
import prisma from "../utils/prisma.js";
import { lerId, validarTutor } from "../utils/validacao.js";

const tutoresRouter = express.Router();

// Campos devolvidos nas respostas
const camposTutor = { id: true, nome: true, cpf: true, telefone: true, email: true, criadoEm: true };

// Busca o tutor só se for do usuário do token
const buscarTutor = (id, usuarioId) =>
  prisma.tutor.findFirst({ where: { id, usuarioId }, select: camposTutor });

// Lista os tutores do usuário, com filtro opcional ?nome=
tutoresRouter.get("/", async (req, res, next) => {
  try {
    const where = { usuarioId: req.usuario.id };
    if (typeof req.query.nome === "string" && req.query.nome.trim() !== "") {
      where.nome = { contains: req.query.nome.trim(), mode: "insensitive" };
    }
    const tutores = await prisma.tutor.findMany({ where, select: camposTutor, orderBy: { nome: "asc" } });
    res.json(tutores);
  } catch (error) {
    next(error);
  }
});

// Cria um tutor
tutoresRouter.post("/", async (req, res, next) => {
  const { erro, dados } = validarTutor(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    // Confere o CPF antes, para não gastar um id com um INSERT que falharia
    const repetido = await prisma.tutor.findFirst({
      where: { usuarioId: req.usuario.id, cpf: dados.cpf },
      select: { id: true },
    });
    if (repetido) return res.status(409).json({ erro: "CPF já cadastrado" });
    const tutor = await prisma.tutor.create({
      data: { ...dados, usuarioId: req.usuario.id },
      select: camposTutor,
    });
    res.status(201).json(tutor);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ erro: "CPF já cadastrado" });
    next(error);
  }
});

// Busca um tutor
tutoresRouter.get("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const tutor = await buscarTutor(id, req.usuario.id);
    if (!tutor) return res.status(404).json({ erro: "Tutor não encontrado" });
    res.json(tutor);
  } catch (error) {
    next(error);
  }
});

// Altera só os campos enviados
tutoresRouter.put("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  const { erro, dados } = validarTutor(req.body, true);
  if (erro) return res.status(400).json({ erro });
  try {
    if (!(await buscarTutor(id, req.usuario.id))) {
      return res.status(404).json({ erro: "Tutor não encontrado" });
    }
    const tutor = await prisma.tutor.update({ where: { id }, data: dados, select: camposTutor });
    res.json(tutor);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ erro: "CPF já cadastrado" });
    next(error);
  }
});

// Exclui; bloqueia se o tutor tiver pets
tutoresRouter.delete("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const tutor = await prisma.tutor.findFirst({
      where: { id, usuarioId: req.usuario.id },
      select: { _count: { select: { pets: true } } },
    });
    if (!tutor) return res.status(404).json({ erro: "Tutor não encontrado" });
    if (tutor._count.pets > 0) {
      return res.status(409).json({ erro: "Tutor possui pets cadastrados" });
    }
    await prisma.tutor.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    if (error.code === "P2003") return res.status(409).json({ erro: "Tutor possui pets cadastrados" });
    next(error);
  }
});

export default tutoresRouter;

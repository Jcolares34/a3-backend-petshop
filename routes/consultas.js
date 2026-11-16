import express from "express";
import prisma from "../utils/prisma.js";
import { lerId, lerData, statusConsulta, validarConsulta } from "../utils/validacao.js";

const consultasRouter = express.Router();

// Campos devolvidos nas respostas
const camposConsulta = {
  id: true,
  dataHora: true,
  motivo: true,
  diagnostico: true,
  valor: true,
  status: true,
  petId: true,
  criadoEm: true,
};

// Valor como número (o Prisma devolve Decimal como texto)
const formatarConsulta = (consulta) => ({ ...consulta, valor: Number(consulta.valor) });

// A consulta é do usuário quando o tutor do pet é do usuário
const buscarConsulta = (id, usuarioId, select = camposConsulta) =>
  prisma.consulta.findFirst({ where: { id, pet: { tutor: { usuarioId } } }, select });

const petDoUsuario = (petId, usuarioId) =>
  prisma.pet.findFirst({ where: { id: petId, tutor: { usuarioId } }, select: { id: true } });

// Regra de negócio: não dá para marcar "realizada" uma consulta que ainda não aconteceu
const realizadaNoFuturo = (status, dataHora) => status === "realizada" && dataHora > new Date();
const erroRealizada = { erro: "Uma consulta só pode ser marcada como realizada depois da data e hora dela" };

// Lista as consultas do usuário, com filtros ?status=, ?petId= e ?data=AAAA-MM-DD
consultasRouter.get("/", async (req, res, next) => {
  const where = { pet: { tutor: { usuarioId: req.usuario.id } } };
  const { status, petId, data } = req.query;
  if (status !== undefined) {
    if (typeof status !== "string" || !statusConsulta.includes(status.trim().toLowerCase())) {
      return res.status(400).json({ erro: `status deve ser: ${statusConsulta.join(", ")}` });
    }
    where.status = status.trim().toLowerCase();
  }
  if (petId !== undefined) {
    if (!/^\d+$/.test(String(petId)) || Number(petId) <= 0) {
      return res.status(400).json({ erro: "petId deve ser um número inteiro" });
    }
    where.petId = Number(petId);
  }
  if (data !== undefined) {
    const dia = lerData(data);
    if (!dia) return res.status(400).json({ erro: "data deve estar no formato AAAA-MM-DD" });
    // O dia inteiro no horário de Brasília (UTC-3)
    const inicio = new Date(`${dia}T00:00:00-03:00`);
    const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
    where.dataHora = { gte: inicio, lt: fim };
  }
  try {
    const consultas = await prisma.consulta.findMany({
      where,
      select: camposConsulta,
      orderBy: { dataHora: "asc" },
    });
    res.json(consultas.map(formatarConsulta));
  } catch (error) {
    next(error);
  }
});

// Cria uma consulta para um pet do usuário
consultasRouter.post("/", async (req, res, next) => {
  const { erro, dados } = validarConsulta(req.body);
  if (erro) return res.status(400).json({ erro });
  if (realizadaNoFuturo(dados.status, dados.dataHora)) return res.status(400).json(erroRealizada);
  try {
    if (!(await petDoUsuario(dados.petId, req.usuario.id))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    const consulta = await prisma.consulta.create({ data: dados, select: camposConsulta });
    res.status(201).json(formatarConsulta(consulta));
  } catch (error) {
    next(error);
  }
});

// Busca uma consulta, com o nome do pet
consultasRouter.get("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const consulta = await buscarConsulta(id, req.usuario.id, {
      ...camposConsulta,
      pet: { select: { id: true, nome: true } },
    });
    if (!consulta) return res.status(404).json({ erro: "Consulta não encontrada" });
    res.json(formatarConsulta(consulta));
  } catch (error) {
    next(error);
  }
});

// Altera só os campos enviados; a regra do "realizada" vale com os valores finais
consultasRouter.put("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  const { erro, dados } = validarConsulta(req.body, true);
  if (erro) return res.status(400).json({ erro });
  try {
    const atual = await buscarConsulta(id, req.usuario.id, { status: true, dataHora: true });
    if (!atual) return res.status(404).json({ erro: "Consulta não encontrada" });
    const status = dados.status ?? atual.status;
    const dataHora = dados.dataHora ?? atual.dataHora;
    if (realizadaNoFuturo(status, dataHora)) return res.status(400).json(erroRealizada);
    if (dados.petId && !(await petDoUsuario(dados.petId, req.usuario.id))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    const consulta = await prisma.consulta.update({ where: { id }, data: dados, select: camposConsulta });
    res.json(formatarConsulta(consulta));
  } catch (error) {
    next(error);
  }
});

// Exclui uma consulta
consultasRouter.delete("/:id", async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    if (!(await buscarConsulta(id, req.usuario.id, { id: true }))) {
      return res.status(404).json({ erro: "Consulta não encontrada" });
    }
    await prisma.consulta.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export { formatarConsulta, camposConsulta };
export default consultasRouter;

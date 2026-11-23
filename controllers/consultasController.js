import prisma from "../utils/prisma.js";
import { lerId, ehId, lerData, statusConsulta, validarConsulta } from "../utils/validacao.js";
import { montarUrl } from "../utils/links.js";

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
  pet: { select: { id: true, nome: true } },
};

// Valor como número (o Prisma devolve Decimal como texto) e as URLs da consulta e do pet
const formatarConsulta = (consulta, req) => {
  const { pet, ...dados } = consulta;
  return {
    ...dados,
    valor: Number(consulta.valor),
    url: montarUrl(req, `/consultas/${consulta.id}`),
    pet: { ...pet, url: montarUrl(req, `/pets/${consulta.petId}`) },
  };
};

// A consulta é do usuário quando o tutor do pet é do usuário
const consultaDoUsuario = (id, usuarioId, select = camposConsulta) =>
  prisma.consulta.findFirst({ where: { id, pet: { tutor: { usuarioId } } }, select });

const petDoUsuario = (petId, usuarioId) =>
  prisma.pet.findFirst({ where: { id: petId, tutor: { usuarioId } }, select: { id: true } });

// Regra de negócio: não dá para marcar "realizada" uma consulta que ainda não aconteceu
const realizadaNoFuturo = (status, dataHora) => status === "realizada" && dataHora > new Date();
const erroRealizada = { erro: "Uma consulta só pode ser marcada como realizada depois da data e hora dela" };

// Lista as consultas do usuário, com filtros ?status=, ?petId= e ?data=AAAA-MM-DD
const listarConsultas = async (req, res, next) => {
  const where = { pet: { tutor: { usuarioId: req.usuario.id } } };
  const { status, petId, data } = req.query;
  if (status !== undefined) {
    if (typeof status !== "string" || !statusConsulta.includes(status.trim().toLowerCase())) {
      return res.status(400).json({ erro: `status deve ser: ${statusConsulta.join(", ")}` });
    }
    where.status = status.trim().toLowerCase();
  }
  if (petId !== undefined) {
    if (!ehId(petId)) {
      return res.status(400).json({ erro: "petId inválido (deve ter 20 caracteres)" });
    }
    where.petId = petId;
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
    res.json(consultas.map((consulta) => formatarConsulta(consulta, req)));
  } catch (error) {
    next(error);
  }
};

// Cria uma consulta para um pet do usuário
const criarConsulta = async (req, res, next) => {
  const { erro, dados } = validarConsulta(req.body);
  if (erro) return res.status(400).json({ erro });
  if (realizadaNoFuturo(dados.status, dados.dataHora)) return res.status(400).json(erroRealizada);
  try {
    if (!(await petDoUsuario(dados.petId, req.usuario.id))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    const consulta = await prisma.consulta.create({ data: dados, select: camposConsulta });
    res.status(201).json(formatarConsulta(consulta, req));
  } catch (error) {
    next(error);
  }
};

// Busca uma consulta
const buscarConsulta = async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    const consulta = await consultaDoUsuario(id, req.usuario.id);
    if (!consulta) return res.status(404).json({ erro: "Consulta não encontrada" });
    res.json(formatarConsulta(consulta, req));
  } catch (error) {
    next(error);
  }
};

// Altera só os campos enviados; a regra do "realizada" vale com os valores finais
const alterarConsulta = async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  const { erro, dados } = validarConsulta(req.body, true);
  if (erro) return res.status(400).json({ erro });
  try {
    const atual = await consultaDoUsuario(id, req.usuario.id, { status: true, dataHora: true });
    if (!atual) return res.status(404).json({ erro: "Consulta não encontrada" });
    const status = dados.status ?? atual.status;
    const dataHora = dados.dataHora ?? atual.dataHora;
    if (realizadaNoFuturo(status, dataHora)) return res.status(400).json(erroRealizada);
    if (dados.petId && !(await petDoUsuario(dados.petId, req.usuario.id))) {
      return res.status(404).json({ erro: "Pet não encontrado" });
    }
    const consulta = await prisma.consulta.update({ where: { id }, data: dados, select: camposConsulta });
    res.json(formatarConsulta(consulta, req));
  } catch (error) {
    next(error);
  }
};

// Exclui uma consulta
const excluirConsulta = async (req, res, next) => {
  const id = lerId(req);
  if (id === null) return res.status(400).json({ erro: "id inválido" });
  try {
    if (!(await consultaDoUsuario(id, req.usuario.id, { id: true }))) {
      return res.status(404).json({ erro: "Consulta não encontrada" });
    }
    await prisma.consulta.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export {
  listarConsultas,
  criarConsulta,
  buscarConsulta,
  alterarConsulta,
  excluirConsulta,
  formatarConsulta,
  camposConsulta,
};

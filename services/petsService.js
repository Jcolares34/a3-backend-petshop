import prisma from "../utils/prisma.js";
import { ErroApi } from "../utils/erros.js";
import { camposConsulta } from "../controllers/consultasController.js";

// Campos devolvidos nas respostas, já com o tutor
const camposPet = {
  id: true,
  nome: true,
  especie: true,
  raca: true,
  dataNascimento: true,
  peso: true,
  tutorId: true,
  criadoEm: true,
  tutor: { select: { id: true, nome: true } },
};

const naoEncontrado = () => new ErroApi(404, "Pet não encontrado");
const possuiConsultas = () => new ErroApi(409, "Pet possui consultas cadastradas");

// O pet é do usuário quando o tutor dele é do usuário
const petDoUsuario = (usuarioId, id, select = camposPet) =>
  prisma.pet.findFirst({ where: { id, tutor: { usuarioId } }, select });

// O tutor precisa ser do usuário; senão 404
const exigirTutor = async (usuarioId, tutorId) => {
  const tutor = await prisma.tutor.findFirst({ where: { id: tutorId, usuarioId }, select: { id: true } });
  if (!tutor) throw new ErroApi(404, "Tutor não encontrado");
};

// O pet, só se for do usuário; senão 404
const buscar = async (usuarioId, id) => {
  const pet = await petDoUsuario(usuarioId, id);
  if (!pet) throw naoEncontrado();
  return pet;
};

// Pets do usuário, com filtros opcionais de espécie e tutor
const listar = (usuarioId, { especie, tutorId }) => {
  const where = { tutor: { usuarioId } };
  if (especie) where.especie = especie;
  if (tutorId) where.tutorId = tutorId;
  return prisma.pet.findMany({ where, select: camposPet, orderBy: { nome: "asc" } });
};

// Cria um pet para um tutor do usuário
const criar = async (usuarioId, dados) => {
  await exigirTutor(usuarioId, dados.tutorId);
  return prisma.pet.create({ data: dados, select: camposPet });
};

// Histórico de consultas do pet, da mais recente para a mais antiga
const listarConsultas = async (usuarioId, id) => {
  if (!(await petDoUsuario(usuarioId, id, { id: true }))) throw naoEncontrado();
  return prisma.consulta.findMany({ where: { petId: id }, select: camposConsulta, orderBy: { dataHora: "desc" } });
};

// Altera só os campos enviados; o novo tutor também precisa ser do usuário
const alterar = async (usuarioId, id, dados) => {
  if (!(await petDoUsuario(usuarioId, id, { id: true }))) throw naoEncontrado();
  if (dados.tutorId) await exigirTutor(usuarioId, dados.tutorId);
  return prisma.pet.update({ where: { id }, data: dados, select: camposPet });
};

// Exclui; bloqueia se o pet tiver consultas
const excluir = async (usuarioId, id) => {
  const pet = await petDoUsuario(usuarioId, id, { _count: { select: { consultas: true } } });
  if (!pet) throw naoEncontrado();
  if (pet._count.consultas > 0) throw possuiConsultas();
  try {
    await prisma.pet.delete({ where: { id } });
  } catch (error) {
    if (error.code === "P2003") throw possuiConsultas();
    throw error;
  }
};

export { camposPet, buscar, listar, criar, listarConsultas, alterar, excluir };

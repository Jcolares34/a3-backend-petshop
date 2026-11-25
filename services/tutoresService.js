import prisma from "../utils/prisma.js";
import { ErroApi } from "../utils/erros.js";
import { camposPet } from "../controllers/petsController.js";

// Campos devolvidos nas respostas
const camposTutor = { id: true, nome: true, cpf: true, telefone: true, email: true, criadoEm: true };

const naoEncontrado = () => new ErroApi(404, "Tutor não encontrado");
const cpfRepetido = () => new ErroApi(409, "CPF já cadastrado");
const possuiPets = () => new ErroApi(409, "Tutor possui pets cadastrados");

// O tutor, só se for do usuário; senão 404
const buscar = async (usuarioId, id) => {
  const tutor = await prisma.tutor.findFirst({ where: { id, usuarioId }, select: camposTutor });
  if (!tutor) throw naoEncontrado();
  return tutor;
};

// Tutores do usuário, com filtro opcional por parte do nome
const listar = (usuarioId, nome) => {
  const where = { usuarioId };
  if (nome) where.nome = { contains: nome, mode: "insensitive" };
  return prisma.tutor.findMany({ where, select: camposTutor, orderBy: { nome: "asc" } });
};

// Cria; o CPF não pode repetir entre os tutores do mesmo usuário
const criar = async (usuarioId, dados) => {
  const repetido = await prisma.tutor.findFirst({ where: { usuarioId, cpf: dados.cpf }, select: { id: true } });
  if (repetido) throw cpfRepetido();
  try {
    return await prisma.tutor.create({ data: { ...dados, usuarioId }, select: camposTutor });
  } catch (error) {
    if (error.code === "P2002") throw cpfRepetido();
    throw error;
  }
};

// Pets de um tutor do usuário
const listarPets = async (usuarioId, id) => {
  await buscar(usuarioId, id);
  return prisma.pet.findMany({ where: { tutorId: id }, select: camposPet, orderBy: { nome: "asc" } });
};

// Altera só os campos enviados
const alterar = async (usuarioId, id, dados) => {
  await buscar(usuarioId, id);
  try {
    return await prisma.tutor.update({ where: { id }, data: dados, select: camposTutor });
  } catch (error) {
    if (error.code === "P2002") throw cpfRepetido();
    throw error;
  }
};

// Exclui; bloqueia se o tutor tiver pets
const excluir = async (usuarioId, id) => {
  const tutor = await prisma.tutor.findFirst({
    where: { id, usuarioId },
    select: { _count: { select: { pets: true } } },
  });
  if (!tutor) throw naoEncontrado();
  if (tutor._count.pets > 0) throw possuiPets();
  try {
    await prisma.tutor.delete({ where: { id } });
  } catch (error) {
    if (error.code === "P2003") throw possuiPets();
    throw error;
  }
};

export { buscar, listar, criar, listarPets, alterar, excluir };

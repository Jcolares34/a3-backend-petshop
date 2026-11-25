import prisma from "../utils/prisma.js";
import { ErroApi } from "../utils/erros.js";

// Campos devolvidos nas respostas, já com o pet
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

const naoEncontrada = () => new ErroApi(404, "Consulta não encontrada");

// Regra de negócio: não dá para marcar "realizada" uma consulta que ainda não aconteceu
const realizadaNoFuturo = (status, dataHora) => status === "realizada" && dataHora > new Date();
const erroRealizada = () =>
  new ErroApi(400, "Uma consulta só pode ser marcada como realizada depois da data e hora dela");

// A consulta é do usuário quando o tutor do pet é do usuário
const consultaDoUsuario = (usuarioId, id, select = camposConsulta) =>
  prisma.consulta.findFirst({ where: { id, pet: { tutor: { usuarioId } } }, select });

// O pet precisa ser do usuário; senão 404
const exigirPet = async (usuarioId, petId) => {
  const pet = await prisma.pet.findFirst({ where: { id: petId, tutor: { usuarioId } }, select: { id: true } });
  if (!pet) throw new ErroApi(404, "Pet não encontrado");
};

// Consultas do usuário, com filtros opcionais de status, pet e dia
const listar = (usuarioId, { status, petId, data }) => {
  const where = { pet: { tutor: { usuarioId } } };
  if (status) where.status = status;
  if (petId) where.petId = petId;
  if (data) {
    // O dia inteiro no horário de Brasília (UTC-3)
    const inicio = new Date(`${data}T00:00:00-03:00`);
    where.dataHora = { gte: inicio, lt: new Date(inicio.getTime() + 24 * 60 * 60 * 1000) };
  }
  return prisma.consulta.findMany({ where, select: camposConsulta, orderBy: { dataHora: "asc" } });
};

// Cria uma consulta para um pet do usuário
const criar = async (usuarioId, dados) => {
  if (realizadaNoFuturo(dados.status, dados.dataHora)) throw erroRealizada();
  await exigirPet(usuarioId, dados.petId);
  return prisma.consulta.create({ data: dados, select: camposConsulta });
};

// A consulta, só se for do usuário; senão 404
const buscar = async (usuarioId, id) => {
  const consulta = await consultaDoUsuario(usuarioId, id);
  if (!consulta) throw naoEncontrada();
  return consulta;
};

// Altera só os campos enviados; a regra do "realizada" vale com os valores finais
const alterar = async (usuarioId, id, dados) => {
  const atual = await consultaDoUsuario(usuarioId, id, { status: true, dataHora: true });
  if (!atual) throw naoEncontrada();
  if (realizadaNoFuturo(dados.status ?? atual.status, dados.dataHora ?? atual.dataHora)) throw erroRealizada();
  if (dados.petId) await exigirPet(usuarioId, dados.petId);
  return prisma.consulta.update({ where: { id }, data: dados, select: camposConsulta });
};

// Exclui uma consulta
const excluir = async (usuarioId, id) => {
  if (!(await consultaDoUsuario(usuarioId, id, { id: true }))) throw naoEncontrada();
  await prisma.consulta.delete({ where: { id } });
};

export { camposConsulta, listar, criar, buscar, alterar, excluir };

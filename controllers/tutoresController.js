import * as tutoresService from "../services/tutoresService.js";
import { validarTutor } from "../utils/validacao.js";
import { validarOuFalhar, idOuFalhar } from "../utils/erros.js";
import { montarUrl } from "../utils/links.js";
import { formatarPet } from "./petsController.js";

// Acrescenta as URLs do tutor e dos pets dele
const formatarTutor = (tutor, req) => ({
  ...tutor,
  url: montarUrl(req, `/tutores/${tutor.id}`),
  urlPets: montarUrl(req, `/tutores/${tutor.id}/pets`),
});

// Lista os tutores do usuário, com filtro opcional ?nome=
const listarTutores = async (req, res) => {
  const nome = typeof req.query.nome === "string" ? req.query.nome.trim() : "";
  const tutores = await tutoresService.listar(req.usuario.id, nome);
  res.json(tutores.map((tutor) => formatarTutor(tutor, req)));
};

// Cria um tutor
const criarTutor = async (req, res) => {
  const dados = validarOuFalhar(validarTutor(req.body));
  const tutor = await tutoresService.criar(req.usuario.id, dados);
  res.status(201).json(formatarTutor(tutor, req));
};

// Busca um tutor
const buscarTutor = async (req, res) => {
  const tutor = await tutoresService.buscar(req.usuario.id, idOuFalhar(req));
  res.json(formatarTutor(tutor, req));
};

// Pets de um tutor do usuário
const listarPetsDoTutor = async (req, res) => {
  const pets = await tutoresService.listarPets(req.usuario.id, idOuFalhar(req));
  res.json(pets.map((pet) => formatarPet(pet, req)));
};

// Altera só os campos enviados
const alterarTutor = async (req, res) => {
  const id = idOuFalhar(req);
  const dados = validarOuFalhar(validarTutor(req.body, true));
  const tutor = await tutoresService.alterar(req.usuario.id, id, dados);
  res.json(formatarTutor(tutor, req));
};

// Exclui; o service bloqueia se o tutor tiver pets
const excluirTutor = async (req, res) => {
  await tutoresService.excluir(req.usuario.id, idOuFalhar(req));
  res.status(204).end();
};

export { listarTutores, criarTutor, buscarTutor, listarPetsDoTutor, alterarTutor, excluirTutor };

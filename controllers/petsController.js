import * as petsService from "../services/petsService.js";
import { ehId, especies, validarPet } from "../utils/validacao.js";
import { ErroApi, validarOuFalhar, idOuFalhar } from "../utils/erros.js";
import { montarUrl } from "../utils/links.js";
import { formatarConsulta } from "./consultasController.js";

// Peso como número, data de nascimento como AAAA-MM-DD e as URLs do pet, do tutor e das consultas
const formatarPet = (pet, req) => {
  const { tutor, ...dados } = pet;
  return {
    ...dados,
    peso: pet.peso === null ? null : Number(pet.peso),
    dataNascimento: pet.dataNascimento ? pet.dataNascimento.toISOString().slice(0, 10) : null,
    url: montarUrl(req, `/pets/${pet.id}`),
    tutor: { ...tutor, url: montarUrl(req, `/tutores/${pet.tutorId}`) },
    urlConsultas: montarUrl(req, `/pets/${pet.id}/consultas`),
  };
};

// Lista os pets do usuário, com filtros opcionais ?especie= e ?tutorId=
const listarPets = async (req, res) => {
  const { especie, tutorId } = req.query;
  const filtros = {};
  if (especie !== undefined) {
    if (typeof especie !== "string" || !especies.includes(especie.trim().toLowerCase())) {
      throw new ErroApi(400, `especie deve ser: ${especies.join(", ")}`);
    }
    filtros.especie = especie.trim().toLowerCase();
  }
  if (tutorId !== undefined) {
    if (!ehId(tutorId)) throw new ErroApi(400, "tutorId inválido (deve ter 20 caracteres)");
    filtros.tutorId = tutorId;
  }
  const pets = await petsService.listar(req.usuario.id, filtros);
  res.json(pets.map((pet) => formatarPet(pet, req)));
};

// Cria um pet para um tutor do usuário
const criarPet = async (req, res) => {
  const dados = validarOuFalhar(validarPet(req.body));
  const pet = await petsService.criar(req.usuario.id, dados);
  res.status(201).json(formatarPet(pet, req));
};

// Busca um pet
const buscarPet = async (req, res) => {
  const pet = await petsService.buscar(req.usuario.id, idOuFalhar(req));
  res.json(formatarPet(pet, req));
};

// Histórico de consultas do pet
const listarConsultasDoPet = async (req, res) => {
  const consultas = await petsService.listarConsultas(req.usuario.id, idOuFalhar(req));
  res.json(consultas.map((consulta) => formatarConsulta(consulta, req)));
};

// Altera só os campos enviados
const alterarPet = async (req, res) => {
  const id = idOuFalhar(req);
  const dados = validarOuFalhar(validarPet(req.body, true));
  const pet = await petsService.alterar(req.usuario.id, id, dados);
  res.json(formatarPet(pet, req));
};

// Exclui; o service bloqueia se o pet tiver consultas
const excluirPet = async (req, res) => {
  await petsService.excluir(req.usuario.id, idOuFalhar(req));
  res.status(204).end();
};

export { listarPets, criarPet, buscarPet, listarConsultasDoPet, alterarPet, excluirPet, formatarPet };

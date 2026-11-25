import * as consultasService from "../services/consultasService.js";
import { ehId, lerData, statusConsulta, validarConsulta } from "../utils/validacao.js";
import { ErroApi, validarOuFalhar, idOuFalhar } from "../utils/erros.js";
import { montarUrl } from "../utils/links.js";

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

// Lista as consultas do usuário, com filtros ?status=, ?petId= e ?data=AAAA-MM-DD
const listarConsultas = async (req, res) => {
  const { status, petId, data } = req.query;
  const filtros = {};
  if (status !== undefined) {
    if (typeof status !== "string" || !statusConsulta.includes(status.trim().toLowerCase())) {
      throw new ErroApi(400, `status deve ser: ${statusConsulta.join(", ")}`);
    }
    filtros.status = status.trim().toLowerCase();
  }
  if (petId !== undefined) {
    if (!ehId(petId)) throw new ErroApi(400, "petId inválido (deve ter 20 caracteres)");
    filtros.petId = petId;
  }
  if (data !== undefined) {
    filtros.data = lerData(data);
    if (!filtros.data) throw new ErroApi(400, "data deve estar no formato AAAA-MM-DD");
  }
  const consultas = await consultasService.listar(req.usuario.id, filtros);
  res.json(consultas.map((consulta) => formatarConsulta(consulta, req)));
};

// Cria uma consulta para um pet do usuário
const criarConsulta = async (req, res) => {
  const dados = validarOuFalhar(validarConsulta(req.body));
  const consulta = await consultasService.criar(req.usuario.id, dados);
  res.status(201).json(formatarConsulta(consulta, req));
};

// Busca uma consulta
const buscarConsulta = async (req, res) => {
  const consulta = await consultasService.buscar(req.usuario.id, idOuFalhar(req));
  res.json(formatarConsulta(consulta, req));
};

// Altera só os campos enviados
const alterarConsulta = async (req, res) => {
  const id = idOuFalhar(req);
  const dados = validarOuFalhar(validarConsulta(req.body, true));
  const consulta = await consultasService.alterar(req.usuario.id, id, dados);
  res.json(formatarConsulta(consulta, req));
};

// Exclui uma consulta
const excluirConsulta = async (req, res) => {
  await consultasService.excluir(req.usuario.id, idOuFalhar(req));
  res.status(204).end();
};

export { listarConsultas, criarConsulta, buscarConsulta, alterarConsulta, excluirConsulta, formatarConsulta };

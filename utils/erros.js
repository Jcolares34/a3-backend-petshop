import { lerId } from "./validacao.js";

// Erro com código HTTP: os services lançam e o tratador do app.js responde { erro }
class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// O Express 4 não pega sozinho os erros de funções async: repassa para o next
const capturar = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Dados validados, ou 400 com a mensagem da validação
const validarOuFalhar = ({ erro, dados }) => {
  if (erro) throw new ErroApi(400, erro);
  return dados;
};

// O :id da rota, ou 400 se não estiver no formato
const idOuFalhar = (req) => {
  const id = lerId(req);
  if (id === null) throw new ErroApi(400, "id inválido");
  return id;
};

export { ErroApi, capturar, validarOuFalhar, idOuFalhar };

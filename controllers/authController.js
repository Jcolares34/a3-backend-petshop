import * as authService from "../services/authService.js";
import { firebaseAuth } from "../tools/firebase.js";
import { ErroApi } from "../utils/erros.js";

// Sem as chaves do Firebase no .env, as rotas de autenticação respondem 503
const exigirFirebase = (req, res, next) => {
  if (!firebaseAuth) {
    return res.status(503).json({ erro: "Firebase não configurado no .env" });
  }
  next();
};

const textoPreenchido = (valor) => typeof valor === "string" && valor.trim() !== "";

// Cadastro: confere os campos e cria o usuário no Firebase e no banco
const cadastrar = async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!textoPreenchido(nome) || !textoPreenchido(email) || !textoPreenchido(senha)) {
    throw new ErroApi(400, "Informe nome, email e senha");
  }
  if (nome.trim().length > 100) throw new ErroApi(400, "O nome pode ter no máximo 100 caracteres");
  if (senha.length < 6) throw new ErroApi(400, "A senha precisa ter pelo menos 6 caracteres");
  const usuario = await authService.cadastrar(nome.trim(), email.trim(), senha);
  res.status(201).json(usuario);
};

// Login: devolve o token e quantos segundos ele vale
const login = async (req, res) => {
  const { email, senha } = req.body || {};
  if (!textoPreenchido(email) || !textoPreenchido(senha)) {
    throw new ErroApi(400, "Informe email e senha");
  }
  res.json(await authService.login(email.trim(), senha));
};

// Dados do usuário dono do token
const eu = async (req, res) => {
  res.json(await authService.buscarUsuario(req.usuario.id));
};

// Confere o token e diz quanto tempo falta para vencer
const conferirToken = (req, res) => {
  const { id, email, expiraEm } = req.usuario;
  res.json({
    valido: true,
    usuario: { id, email },
    expiraEm: Math.max(0, expiraEm - Math.floor(Date.now() / 1000)),
    expiraEmData: new Date(expiraEm * 1000).toISOString(),
  });
};

export { exigirFirebase, cadastrar, login, eu, conferirToken };

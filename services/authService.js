import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "../tools/firebase.js";
import prisma from "../utils/prisma.js";
import { createToken, validadeToken } from "../utils/index.js";
import { ErroApi } from "../utils/erros.js";

const camposUsuario = { id: true, nome: true, email: true };

const emailRepetido = () => new ErroApi(409, "E-mail já cadastrado");

// Erros do Firebase que viram resposta para o cliente; os outros seguem como 500
const traduzirErroFirebase = (error) => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return emailRepetido();
    case "auth/weak-password":
      return new ErroApi(400, "A senha precisa ter pelo menos 6 caracteres");
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return new ErroApi(401, "E-mail ou senha inválidos");
    case "auth/too-many-requests":
      return new ErroApi(429, "Muitas tentativas, aguarde alguns minutos");
    default:
      return error;
  }
};

// Cria o usuário no Firebase e grava na tabela usuarios
const cadastrar = async (nome, email, senha) => {
  let credencial;
  try {
    credencial = await createUserWithEmailAndPassword(firebaseAuth, email, senha);
  } catch (error) {
    throw error.code === "auth/invalid-email" ? new ErroApi(400, "E-mail inválido") : traduzirErroFirebase(error);
  }

  // Se não conseguir gravar no banco, desfaz o cadastro no Firebase
  try {
    await updateProfile(credencial.user, { displayName: nome });
    return await prisma.usuario.create({
      data: { id: credencial.user.uid, nome, email: credencial.user.email },
      select: camposUsuario,
    });
  } catch (error) {
    await deleteUser(credencial.user).catch(() => {});
    if (error.code === "P2002") throw emailRepetido();
    throw error;
  }
};

// Confere e-mail e senha no Firebase e devolve o JWT da nossa API
const login = async (email, senha) => {
  let credencial;
  try {
    credencial = await signInWithEmailAndPassword(firebaseAuth, email, senha);
  } catch (error) {
    throw error.code === "auth/invalid-email" ? new ErroApi(401, "E-mail ou senha inválidos") : traduzirErroFirebase(error);
  }
  const { uid, email: emailFirebase, displayName } = credencial.user;

  // Garante a linha em usuarios (ex.: usuário criado em outro banco ou no console do Firebase)
  await prisma.usuario.upsert({
    where: { id: uid },
    update: {},
    create: { id: uid, nome: displayName || emailFirebase.split("@")[0], email: emailFirebase },
  });

  const { jwt } = await createToken({ sub: uid, email: emailFirebase });
  return { token: jwt, expiraEm: validadeToken };
};

// Dados do usuário, ou 404
const buscarUsuario = async (id) => {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: camposUsuario });
  if (!usuario) throw new ErroApi(404, "Usuário não encontrado");
  return usuario;
};

export { cadastrar, login, buscarUsuario };

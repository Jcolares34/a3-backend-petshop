import express from "express";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { firebaseAuth } from "../tools/firebase.js";
import prisma from "../utils/prisma.js";
import { createToken, validadeToken } from "../utils/index.js";
import autenticar from "../utils/autenticar.js";

const authRouter = express.Router();

const textoPreenchido = (valor) => typeof valor === "string" && valor.trim() !== "";

authRouter.use((req, res, next) => {
  if (!firebaseAuth) {
    return res.status(503).json({ erro: "Firebase não configurado no .env" });
  }
  next();
});

// Cadastro: cria o usuário no Firebase e grava na tabela usuarios
authRouter.post("/cadastro", async (req, res, next) => {
  const { nome, email, senha } = req.body || {};
  if (!textoPreenchido(nome) || !textoPreenchido(email) || !textoPreenchido(senha)) {
    return res.status(400).json({ erro: "Informe nome, email e senha" });
  }
  if (nome.trim().length > 100) {
    return res.status(400).json({ erro: "O nome pode ter no máximo 100 caracteres" });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha precisa ter pelo menos 6 caracteres" });
  }

  let credencial;
  try {
    credencial = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), senha);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    }
    if (error.code === "auth/invalid-email") {
      return res.status(400).json({ erro: "E-mail inválido" });
    }
    if (error.code === "auth/weak-password") {
      return res.status(400).json({ erro: "A senha precisa ter pelo menos 6 caracteres" });
    }
    return next(error);
  }

  // Se não conseguir gravar no banco, desfaz o cadastro no Firebase
  try {
    const usuario = await prisma.usuario.create({
      data: { id: credencial.user.uid, nome: nome.trim(), email: credencial.user.email },
    });
    res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
  } catch (error) {
    await deleteUser(credencial.user).catch(() => {});
    if (error.code === "P2002") {
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    }
    next(error);
  }
});

// Login: confere e-mail e senha no Firebase e devolve o JWT da nossa API
authRouter.post("/login", async (req, res, next) => {
  const { email, senha } = req.body || {};
  if (!textoPreenchido(email) || !textoPreenchido(senha)) {
    return res.status(400).json({ erro: "Informe email e senha" });
  }
  try {
    const credencial = await signInWithEmailAndPassword(firebaseAuth, email.trim(), senha);
    const { jwt } = await createToken({ sub: credencial.user.uid, email: credencial.user.email });
    res.json({ token: jwt, expiraEm: validadeToken });
  } catch (error) {
    if (["auth/invalid-credential", "auth/invalid-email", "auth/user-not-found", "auth/wrong-password"].includes(error.code)) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }
    if (error.code === "auth/too-many-requests") {
      return res.status(429).json({ erro: "Muitas tentativas, aguarde alguns minutos" });
    }
    next(error);
  }
});

// Dados do usuário dono do token
authRouter.get("/eu", autenticar, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, nome: true, email: true },
    });
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    next(error);
  }
});

export default authRouter;

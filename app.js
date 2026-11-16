import express from "express";
import logger from "morgan";
import cors from "cors";

import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import { versionMiddleware } from "./utils/index.js";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(versionMiddleware);

app.use("/", indexRouter);
app.use("/auth", authRouter);

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

// Erros: JSON malformado no corpo ou falha inesperada
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor" });
});

export default app;

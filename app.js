import express from "express";
import logger from "morgan";
import cors from "cors";

import { setRotas } from "./routes/setup.js";
import { versionMiddleware } from "./utils/index.js";
import { ErroApi } from "./utils/erros.js";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(versionMiddleware);

setRotas(app);

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

// Erros: os lançados pelos services, JSON malformado no corpo ou falha inesperada
app.use((err, req, res, next) => {
  if (err instanceof ErroApi) {
    return res.status(err.status).json({ erro: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição" });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor" });
});

export default app;

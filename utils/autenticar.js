import { openTokenJWT } from "./index.js";

// Exige "Authorization: Bearer <token>" e guarda o dono do token em req.usuario
const autenticar = (req, res, next) => {
  const [tipo, token] = (req.get("Authorization") || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token ausente, inválido ou expirado" });
  }
  openTokenJWT(token)
    .then((payload) => {
      req.usuario = { id: payload.sub, email: payload.email };
      next();
    })
    .catch(() => {
      res.status(401).json({ erro: "Token ausente, inválido ou expirado" });
    });
};

export default autenticar;

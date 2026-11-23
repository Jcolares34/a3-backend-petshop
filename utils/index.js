import { jwtVerify, SignJWT } from "jose";
import { createSecretKey } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { version } from "../versao.js";

const validadeToken = 900;

const tokenSecret = process.env.tokenSecret;
if (!tokenSecret) {
  console.error("Falta o tokenSecret no arquivo .env (veja o .env.example)");
  process.exit(1);
}
const secret = createSecretKey(tokenSecret, "utf-8");

// Abre o token JWT e devolve o payload, ou rejeita com { codigo: "expirado" | "invalido" }
const openTokenJWT = (jwt) => {
  return new Promise((resolve, reject) => {
    jwtVerify(jwt, secret, { algorithms: ["HS256"] })
      .then((result) => {
        resolve(result.payload);
      })
      .catch((error) => {
        if (error.code == "ERR_JWT_EXPIRED") {
          reject({ codigo: "expirado" });
        } else {
          reject({ codigo: "invalido" });
        }
      });
  });
};

// Cria um token JWT assinado com validade de validadeToken segundos
const createToken = async (data) => {
  let jwt = undefined;
  if (!data.jti) {
    data.jti = uuidv4();
  }
  try {
    jwt = await new SignJWT(data)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setSubject(data.sub)
      .setJti(data.jti)
      .setExpirationTime(validadeToken + "s")
      .sign(secret);
  } catch (error) {
    console.error("Erro ao criar o token JWT", error);
  }
  return { jwt: jwt, jti: data.jti };
};

// Exige "Authorization: Bearer <token>": ausente ou inválido → 401, vencido → 498
const tokenMiddleware = (req, res, next) => {
  const [tipo, token] = (req.get("Authorization") || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token ausente ou inválido" });
  }
  openTokenJWT(token)
    .then((payload) => {
      req.usuario = { id: payload.sub, email: payload.email, expiraEm: payload.exp };
      next();
    })
    .catch((error) => {
      if (error.codigo === "expirado") {
        return res.status(498).json({ erro: "Token expirado" });
      }
      res.status(401).json({ erro: "Token ausente ou inválido" });
    });
};

function versionMiddleware(req, res, next) {
  res.setHeader("X-API-Version", version);
  next();
}

export { validadeToken, createToken, openTokenJWT, tokenMiddleware, versionMiddleware };

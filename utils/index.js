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

// Abre o token JWT e devolve o payload, ou rejeita com o motivo
const openTokenJWT = (jwt) => {
  return new Promise((resolve, reject) => {
    jwtVerify(jwt, secret, { algorithms: ["HS256"] })
      .then((result) => {
        resolve(result.payload);
      })
      .catch((error) => {
        if (error.code == "ERR_JWT_EXPIRED") {
          reject("Token de acesso expirado " + error.code);
        } else {
          reject("Token de acesso inválido " + error.code);
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

function versionMiddleware(req, res, next) {
  res.setHeader("X-API-Version", version);
  next();
}

export { validadeToken, createToken, openTokenJWT, versionMiddleware };

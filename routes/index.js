import express from "express";
import { version } from "../versao.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ api: "Petshop A3", versao: version });
});

export default router;

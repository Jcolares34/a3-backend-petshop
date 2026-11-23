// Monta a URL absoluta de um caminho da API a partir da requisição
const montarUrl = (req, caminho) => `${req.protocol}://${req.get("host")}${caminho}`;

export { montarUrl };

// Número do :id da rota, ou null se não for um inteiro positivo
const lerId = (req) => {
  const texto = String(req.params.id);
  if (!/^\d+$/.test(texto)) return null;
  const id = Number(texto);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const ehTexto = (valor) => typeof valor === "string";

// Texto obrigatório com tamanho mínimo e máximo (já sem espaços nas pontas)
const validarTexto = (valor, campo, min, max) => {
  if (!ehTexto(valor) || valor.trim().length < min || valor.trim().length > max) {
    return `${campo} deve ter de ${min} a ${max} caracteres`;
  }
  return null;
};

// Monta os dados a gravar a partir do corpo; parcial = PUT (só os campos enviados)
const validarCampos = (corpo, regras, parcial) => {
  const dados = {};
  for (const [campo, regra] of Object.entries(regras)) {
    const enviado = corpo[campo] !== undefined;
    if (!enviado) {
      if (!parcial && regra.obrigatorio) return { erro: `O campo ${campo} é obrigatório` };
      continue;
    }
    const resultado = regra.validar(corpo[campo]);
    if (resultado.erro) return { erro: resultado.erro };
    dados[campo] = resultado.valor;
  }
  if (parcial && Object.keys(dados).length === 0) {
    return { erro: "Nenhum campo válido para alterar" };
  }
  return { dados };
};

// Regras do tutor
const regrasTutor = {
  nome: {
    obrigatorio: true,
    validar: (v) => {
      const erro = validarTexto(v, "nome", 2, 100);
      return erro ? { erro } : { valor: v.trim() };
    },
  },
  cpf: {
    obrigatorio: true,
    validar: (v) =>
      ehTexto(v) && /^\d{11}$/.test(v.trim())
        ? { valor: v.trim() }
        : { erro: "cpf deve ter exatamente 11 dígitos (só números)" },
  },
  telefone: {
    obrigatorio: true,
    validar: (v) => {
      const erro = validarTexto(v, "telefone", 10, 15);
      return erro ? { erro } : { valor: v.trim() };
    },
  },
  email: {
    obrigatorio: false,
    validar: (v) => {
      if (v === null || v === "") return { valor: null };
      if (!ehTexto(v) || !v.includes("@") || v.trim().length > 255) {
        return { erro: "email inválido" };
      }
      return { valor: v.trim() };
    },
  },
};

const validarTutor = (corpo, parcial = false) => validarCampos(corpo || {}, regrasTutor, parcial);

export { lerId, ehTexto, validarTexto, validarCampos, validarTutor };

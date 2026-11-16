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

const especies = ["cachorro", "gato", "ave", "roedor", "outro"];

// Data de hoje no horário de Brasília, no formato AAAA-MM-DD
const hojeEmBrasilia = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Regras do pet
const regrasPet = {
  nome: {
    obrigatorio: true,
    validar: (v) => {
      const erro = validarTexto(v, "nome", 1, 100);
      return erro ? { erro } : { valor: v.trim() };
    },
  },
  especie: {
    obrigatorio: true,
    validar: (v) =>
      ehTexto(v) && especies.includes(v.trim().toLowerCase())
        ? { valor: v.trim().toLowerCase() }
        : { erro: `especie deve ser: ${especies.join(", ")}` },
  },
  raca: {
    obrigatorio: false,
    validar: (v) => {
      if (v === null || v === "") return { valor: null };
      const erro = validarTexto(v, "raca", 1, 100);
      return erro ? { erro } : { valor: v.trim() };
    },
  },
  dataNascimento: {
    obrigatorio: false,
    validar: (v) => {
      if (v === null || v === "") return { valor: null };
      const data = ehTexto(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
      if (!data || isNaN(data) || data.toISOString().slice(0, 10) !== v) {
        return { erro: "dataNascimento deve ser uma data válida no formato AAAA-MM-DD" };
      }
      if (v > hojeEmBrasilia()) return { erro: "dataNascimento não pode ser no futuro" };
      return { valor: data };
    },
  },
  peso: {
    obrigatorio: false,
    validar: (v) => {
      if (v === null) return { valor: null };
      return typeof v === "number" && v > 0 && v <= 999.99
        ? { valor: v }
        : { erro: "peso deve ser um número maior que 0 e até 999.99" };
    },
  },
  tutorId: {
    obrigatorio: true,
    validar: (v) =>
      Number.isSafeInteger(v) && v > 0 ? { valor: v } : { erro: "tutorId deve ser um número inteiro" },
  },
};

const validarPet = (corpo, parcial = false) => validarCampos(corpo || {}, regrasPet, parcial);

const statusConsulta = ["agendada", "realizada", "cancelada"];

// Data e hora ISO com fuso, ex.: 2026-11-20T14:00:00-03:00 (ou ...Z)
const formatoDataHora = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

// Regras da consulta
const regrasConsulta = {
  dataHora: {
    obrigatorio: true,
    validar: (v) => {
      const data = ehTexto(v) && formatoDataHora.test(v.trim()) ? new Date(v.trim()) : null;
      return data && !isNaN(data)
        ? { valor: data }
        : { erro: "dataHora deve estar no formato ISO com fuso, ex.: 2026-11-20T14:00:00-03:00" };
    },
  },
  motivo: {
    obrigatorio: true,
    validar: (v) => {
      const erro = validarTexto(v, "motivo", 1, 255);
      return erro ? { erro } : { valor: v.trim() };
    },
  },
  diagnostico: {
    obrigatorio: false,
    validar: (v) => {
      if (v === null || v === "") return { valor: null };
      return ehTexto(v) ? { valor: v.trim() } : { erro: "diagnostico deve ser um texto" };
    },
  },
  valor: {
    obrigatorio: true,
    validar: (v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 100000000
        ? { valor: v }
        : { erro: "valor deve ser um número maior ou igual a 0" },
  },
  status: {
    obrigatorio: false,
    validar: (v) =>
      ehTexto(v) && statusConsulta.includes(v.trim().toLowerCase())
        ? { valor: v.trim().toLowerCase() }
        : { erro: `status deve ser: ${statusConsulta.join(", ")}` },
  },
  petId: {
    obrigatorio: true,
    validar: (v) =>
      Number.isSafeInteger(v) && v > 0 ? { valor: v } : { erro: "petId deve ser um número inteiro" },
  },
};

const validarConsulta = (corpo, parcial = false) => validarCampos(corpo || {}, regrasConsulta, parcial);

// Data AAAA-MM-DD válida, ou null
const lerData = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const data = new Date(`${v}T00:00:00Z`);
  return isNaN(data) || data.toISOString().slice(0, 10) !== v ? null : v;
};

export {
  lerId,
  ehTexto,
  validarTexto,
  validarCampos,
  validarTutor,
  especies,
  validarPet,
  statusConsulta,
  validarConsulta,
  lerData,
};

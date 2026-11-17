import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseAuth } from "../tools/firebase.js";
import prisma from "../utils/prisma.js";

// Dados de exemplo de cada conta de teste do Firebase (senha 123456)
const contas = [
  {
    email: "julia.teste@petshop.com",
    nome: "Julia",
    tutores: [
      {
        nome: "Ana Souza", cpf: "12345678901", telefone: "51999990000", email: "ana@email.com",
        pets: [
          {
            nome: "Thor", especie: "cachorro", raca: "Labrador", dataNascimento: "2022-03-10", peso: 30,
            consultas: [
              { dataHora: "2026-09-12T10:00:00-03:00", motivo: "Vacina antirrábica", valor: 90, status: "realizada", diagnostico: "Vacina aplicada, sem reações" },
              { dataHora: "2026-12-20T14:00:00-03:00", motivo: "Vacina V10", valor: 120, status: "agendada" },
            ],
          },
          {
            nome: "Mia", especie: "gato", raca: "SRD", dataNascimento: "2023-06-01", peso: 4.2,
            consultas: [
              { dataHora: "2026-10-03T15:30:00-03:00", motivo: "Check-up anual", valor: 150, status: "realizada", diagnostico: "Saudável" },
              { dataHora: "2026-11-05T09:00:00-03:00", motivo: "Avaliação para castração", valor: 80, status: "cancelada" },
            ],
          },
        ],
      },
      {
        nome: "Carlos Pereira", cpf: "23456789012", telefone: "51988881111", email: "carlos.pereira@email.com",
        pets: [
          {
            nome: "Pipoca", especie: "ave", raca: "Calopsita", dataNascimento: "2024-01-15", peso: 0.09,
            consultas: [
              { dataHora: "2026-11-10T11:00:00-03:00", motivo: "Corte de unhas e bico", valor: 45, status: "realizada" },
            ],
          },
          {
            nome: "Bolinha", especie: "roedor", raca: "Hamster sírio", dataNascimento: "2025-05-20", peso: 0.15,
            consultas: [
              { dataHora: "2026-12-03T16:00:00-03:00", motivo: "Consulta de rotina", valor: 70, status: "agendada" },
            ],
          },
        ],
      },
      {
        nome: "Fernanda Lima", cpf: "34567890123", telefone: "51977772222",
        pets: [
          {
            nome: "Luna", especie: "gato", raca: "Siamês", dataNascimento: "2021-09-09", peso: 3.8,
            consultas: [
              { dataHora: "2026-08-22T10:30:00-03:00", motivo: "Vômitos frequentes", valor: 180, status: "realizada", diagnostico: "Gastrite leve, dieta e medicação por 7 dias" },
              { dataHora: "2026-12-10T10:30:00-03:00", motivo: "Retorno da gastrite", valor: 0, status: "agendada" },
            ],
          },
          {
            nome: "Max", especie: "cachorro", raca: "Golden Retriever", dataNascimento: "2019-12-01", peso: 32.4,
            consultas: [
              { dataHora: "2026-10-15T17:00:00-03:00", motivo: "Dor na pata traseira", valor: 200, status: "realizada", diagnostico: "Displasia leve, indicada fisioterapia" },
              { dataHora: "2026-11-28T08:30:00-03:00", motivo: "Exame de sangue", valor: 220, status: "agendada" },
            ],
          },
        ],
      },
      {
        nome: "Ricardo Alves", cpf: "45678901234", telefone: "51966663333", email: "ricardo.alves@email.com",
        pets: [
          {
            nome: "Shelly", especie: "outro", raca: "Tartaruga tigre-d'água", dataNascimento: "2020-04-04", peso: 1.1,
            consultas: [
              { dataHora: "2027-01-08T14:00:00-03:00", motivo: "Avaliação do casco", valor: 130, status: "agendada" },
            ],
          },
        ],
      },
    ],
  },
  {
    email: "gabi.teste@petshop.com",
    nome: "Gabi",
    tutores: [
      {
        nome: "Beatriz Rocha", cpf: "56789012345", telefone: "51955554444", email: "bia.rocha@email.com",
        pets: [
          {
            nome: "Nina", especie: "cachorro", raca: "Shih Tzu", dataNascimento: "2023-02-14", peso: 6.5,
            consultas: [
              { dataHora: "2026-09-30T13:00:00-03:00", motivo: "Banho terapêutico", valor: 60, status: "realizada" },
              { dataHora: "2026-12-15T09:30:00-03:00", motivo: "Vacina V8", valor: 110, status: "agendada" },
            ],
          },
          {
            nome: "Frajola", especie: "gato", raca: "SRD", dataNascimento: "2022-08-08", peso: 5,
            consultas: [
              { dataHora: "2026-11-02T18:00:00-03:00", motivo: "Coceira e queda de pelo", valor: 160, status: "realizada", diagnostico: "Dermatite alérgica" },
            ],
          },
        ],
      },
      {
        nome: "Marcos Teixeira", cpf: "67890123456", telefone: "51944445555",
        pets: [
          {
            nome: "Kiwi", especie: "ave", raca: "Periquito", dataNascimento: "2024-07-07", peso: 0.04,
            consultas: [
              { dataHora: "2026-12-05T11:00:00-03:00", motivo: "Check-up", valor: 90, status: "agendada" },
            ],
          },
        ],
      },
      {
        nome: "Paula Mendes", cpf: "78901234567", telefone: "51933336666", email: "paula.mendes@email.com",
        pets: [
          {
            nome: "Bob", especie: "cachorro", raca: "Beagle", dataNascimento: "2021-03-03", peso: 12.3,
            consultas: [
              { dataHora: "2026-10-20T10:00:00-03:00", motivo: "Limpeza de tártaro", valor: 350, status: "cancelada" },
              { dataHora: "2027-01-12T10:00:00-03:00", motivo: "Limpeza de tártaro", valor: 350, status: "agendada" },
            ],
          },
          {
            nome: "Pingo", especie: "roedor", raca: "Porquinho-da-índia", dataNascimento: "2024-10-10", peso: 0.9,
            consultas: [
              { dataHora: "2026-11-12T15:00:00-03:00", motivo: "Dente crescido", valor: 100, status: "realizada", diagnostico: "Desgaste dos incisivos" },
            ],
          },
        ],
      },
    ],
  },
];

if (!firebaseAuth) {
  console.error("Faltam as chaves do Firebase no .env");
  process.exit(1);
}

for (const conta of contas) {
  // Pega o uid da conta no Firebase
  let uid;
  try {
    const credencial = await signInWithEmailAndPassword(firebaseAuth, conta.email, "123456");
    uid = credencial.user.uid;
    await signOut(firebaseAuth);
  } catch (error) {
    console.log(`Pulando ${conta.email}: não consegui fazer login (${error.code})`);
    continue;
  }

  // Apaga os dados antigos dessa conta e cria de novo
  await prisma.$transaction(async (tx) => {
    await tx.usuario.upsert({
      where: { id: uid },
      update: {},
      create: { id: uid, nome: conta.nome, email: conta.email },
    });
    await tx.consulta.deleteMany({ where: { pet: { tutor: { usuarioId: uid } } } });
    await tx.pet.deleteMany({ where: { tutor: { usuarioId: uid } } });
    await tx.tutor.deleteMany({ where: { usuarioId: uid } });

    for (const { pets, ...tutor } of conta.tutores) {
      await tx.tutor.create({
        data: {
          ...tutor,
          usuarioId: uid,
          pets: {
            create: pets.map(({ consultas, dataNascimento, ...pet }) => ({
              ...pet,
              dataNascimento: new Date(`${dataNascimento}T00:00:00Z`),
              consultas: {
                create: consultas.map((c) => ({ ...c, dataHora: new Date(c.dataHora) })),
              },
            })),
          },
        },
      });
    }
  });

  const pets = conta.tutores.flatMap((t) => t.pets);
  const consultas = pets.flatMap((p) => p.consultas);
  console.log(`${conta.email}: ${conta.tutores.length} tutores, ${pets.length} pets, ${consultas.length} consultas`);
}

await prisma.$disconnect();
process.exit(0);

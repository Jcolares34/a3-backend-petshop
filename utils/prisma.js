import { PrismaClient } from "@prisma/client";

// Instância única do Prisma usada por todas as rotas
const prisma = new PrismaClient();

export default prisma;

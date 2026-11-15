-- CreateTable
CREATE TABLE "usuarios" (
    "id" VARCHAR(128) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" CHAR(11) NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "usuario_id" VARCHAR(128) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "especie" VARCHAR(20) NOT NULL,
    "raca" VARCHAR(100),
    "data_nascimento" DATE,
    "peso" DECIMAL(5,2),
    "tutor_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" SERIAL NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "diagnostico" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'agendada',
    "pet_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_usuario_id_cpf_key" ON "tutores"("usuario_id", "cpf");

-- AddForeignKey
ALTER TABLE "tutores" ADD CONSTRAINT "tutores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regras CHECK
ALTER TABLE "pets" ADD CONSTRAINT "pets_especie_check" CHECK ("especie" IN ('cachorro','gato','ave','roedor','outro'));
ALTER TABLE "pets" ADD CONSTRAINT "pets_peso_check" CHECK ("peso" > 0);
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_valor_check" CHECK ("valor" >= 0);
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_status_check" CHECK ("status" IN ('agendada','realizada','cancelada'));

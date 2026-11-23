-- Troca o autoincremento por ids de 20 caracteres (nanoid) mantendo os dados existentes

-- Gera um id de 20 caracteres com o mesmo alfabeto do nanoid
CREATE FUNCTION gerar_id_20() RETURNS VARCHAR(20) AS $$
  SELECT string_agg(substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-', (floor(random() * 64) + 1)::int, 1), '')
  FROM generate_series(1, 20);
$$ LANGUAGE sql VOLATILE;

-- Solta as chaves estrangeiras antigas
ALTER TABLE "consultas" DROP CONSTRAINT "consultas_pet_id_fkey";
ALTER TABLE "pets" DROP CONSTRAINT "pets_tutor_id_fkey";

-- Cria as colunas novas e gera os ids de 20 caracteres
ALTER TABLE "tutores" ADD COLUMN "novo_id" VARCHAR(20);
ALTER TABLE "pets" ADD COLUMN "novo_id" VARCHAR(20), ADD COLUMN "novo_tutor_id" VARCHAR(20);
ALTER TABLE "consultas" ADD COLUMN "novo_id" VARCHAR(20), ADD COLUMN "novo_pet_id" VARCHAR(20);
UPDATE "tutores" SET "novo_id" = gerar_id_20();
UPDATE "pets" SET "novo_id" = gerar_id_20();
UPDATE "consultas" SET "novo_id" = gerar_id_20();

-- Liga os registros pelos ids novos
UPDATE "pets" p SET "novo_tutor_id" = t."novo_id" FROM "tutores" t WHERE p."tutor_id" = t."id";
UPDATE "consultas" c SET "novo_pet_id" = p."novo_id" FROM "pets" p WHERE c."pet_id" = p."id";

-- Troca as colunas antigas pelas novas
ALTER TABLE "consultas" DROP COLUMN "id", DROP COLUMN "pet_id";
ALTER TABLE "pets" DROP COLUMN "id", DROP COLUMN "tutor_id";
ALTER TABLE "tutores" DROP COLUMN "id";
ALTER TABLE "tutores" RENAME COLUMN "novo_id" TO "id";
ALTER TABLE "pets" RENAME COLUMN "novo_id" TO "id";
ALTER TABLE "pets" RENAME COLUMN "novo_tutor_id" TO "tutor_id";
ALTER TABLE "consultas" RENAME COLUMN "novo_id" TO "id";
ALTER TABLE "consultas" RENAME COLUMN "novo_pet_id" TO "pet_id";
ALTER TABLE "tutores" ALTER COLUMN "id" SET NOT NULL, ADD CONSTRAINT "tutores_pkey" PRIMARY KEY ("id");
ALTER TABLE "pets" ALTER COLUMN "id" SET NOT NULL, ALTER COLUMN "tutor_id" SET NOT NULL, ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");
ALTER TABLE "consultas" ALTER COLUMN "id" SET NOT NULL, ALTER COLUMN "pet_id" SET NOT NULL, ADD CONSTRAINT "consultas_pkey" PRIMARY KEY ("id");

-- Recria as chaves estrangeiras
ALTER TABLE "pets" ADD CONSTRAINT "pets_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP FUNCTION gerar_id_20();

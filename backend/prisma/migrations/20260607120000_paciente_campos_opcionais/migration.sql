-- Alinha constraints do PostgreSQL ao schema Prisma (campos opcionais em Paciente)
ALTER TABLE "Paciente" ALTER COLUMN "cpf" DROP NOT NULL;
ALTER TABLE "Paciente" ALTER COLUMN "cns" DROP NOT NULL;
ALTER TABLE "Paciente" ALTER COLUMN "data_nascimento" DROP NOT NULL;
ALTER TABLE "Paciente" ALTER COLUMN "idade" DROP NOT NULL;

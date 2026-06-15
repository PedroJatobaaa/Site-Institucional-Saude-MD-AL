-- CreateEnum
CREATE TYPE "StatusTreinamentoProfissional" AS ENUM ('REALIZADO', 'AGENDADO', 'AGUARDANDO');

-- CreateEnum
CREATE TYPE "StatusCadastroAtualizacaoProfissional" AS ENUM ('REALIZADO', 'AGUARDANDO');

-- AlterTable
ALTER TABLE "profissionais"
ADD COLUMN "treinamento" "StatusTreinamentoProfissional" NOT NULL DEFAULT 'AGUARDANDO',
ADD COLUMN "cadastro_atualizacao" "StatusCadastroAtualizacaoProfissional" NOT NULL DEFAULT 'AGUARDANDO';

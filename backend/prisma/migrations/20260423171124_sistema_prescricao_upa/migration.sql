-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "sexo" TEXT,
    "registro_hc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescricao" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "setor" TEXT NOT NULL,
    "leito" TEXT,
    "custo" TEXT,
    "data_prescricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itens" JSONB NOT NULL,
    "medico_nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',

    CONSTRAINT "Prescricao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_key" ON "Paciente"("cpf");

-- AddForeignKey
ALTER TABLE "Prescricao" ADD CONSTRAINT "Prescricao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

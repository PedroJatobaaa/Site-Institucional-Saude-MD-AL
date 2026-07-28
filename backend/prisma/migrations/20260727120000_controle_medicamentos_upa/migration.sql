-- CreateTable
CREATE TABLE "estoques_medicamento" (
    "id" SERIAL NOT NULL,
    "data_referencia" DATE NOT NULL,
    "arquivo_path" TEXT NOT NULL,
    "arquivo_nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "enviado_por" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoques_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos_estoque" (
    "id" SERIAL NOT NULL,
    "estoqueId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT,
    "quantidade" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "medicamentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicamentos_estoque_estoqueId_idx" ON "medicamentos_estoque"("estoqueId");

-- CreateIndex
CREATE INDEX "medicamentos_estoque_nome_idx" ON "medicamentos_estoque"("nome");

-- AddForeignKey
ALTER TABLE "medicamentos_estoque" ADD CONSTRAINT "medicamentos_estoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "estoques_medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

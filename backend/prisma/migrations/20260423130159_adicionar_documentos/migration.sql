-- CreateTable
CREATE TABLE "Documento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "nome_arquivo" TEXT NOT NULL,
    "tipo_extensao" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "url_caminho" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_nome" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

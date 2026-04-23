-- CreateTable
CREATE TABLE "coordenacoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "sigla" VARCHAR(20) NOT NULL,
    "descricao" TEXT,
    "icone" VARCHAR(50),
    "ordem_exibicao" INTEGER,

    CONSTRAINT "coordenacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(255) NOT NULL,
    "link_anexo" VARCHAR(255),
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "coordenacao_id" UUID NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados_carrossel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(255) NOT NULL,
    "imagem_url" VARCHAR(255) NOT NULL,
    "link_destino" VARCHAR(255),
    "ordem_exibicao" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "comunicados_carrossel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_coordenacao_id_fkey" FOREIGN KEY ("coordenacao_id") REFERENCES "coordenacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

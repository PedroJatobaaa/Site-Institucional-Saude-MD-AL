-- CreateTable
CREATE TABLE "profissionais" (
    "id" TEXT NOT NULL,
    "cnes" TEXT,
    "nome_fantasia_estabelecimento" TEXT,
    "nome_profissional" TEXT NOT NULL,
    "pis_pasep" TEXT,
    "cpf" TEXT NOT NULL,
    "numero_cns" TEXT,
    "sexo" TEXT,
    "nome_mae" TEXT,
    "nome_pai" TEXT,
    "data_nascimento" DATE,
    "municipio_nascimento" TEXT,
    "codigo_ibge_municipio_nascimento" TEXT,
    "uf_nascimento" TEXT,
    "raca_cor" TEXT,
    "nacionalidade" TEXT,
    "pais_origem" TEXT,
    "data_entrada" DATE,
    "data_naturalizacao" DATE,
    "numero_portaria" TEXT,
    "escolaridade" TEXT,
    "situacao_familiar_conjugal" TEXT,
    "frequenta_escola" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_profissionais" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "tipo_certidao" TEXT,
    "cartorio" TEXT,
    "livro" TEXT,
    "fls" TEXT,
    "termo" TEXT,
    "data_emissao_certidao" DATE,
    "rg_numero" TEXT,
    "rg_uf" TEXT,
    "rg_orgao_emissor" TEXT,
    "rg_data_emissao" DATE,
    "titulo_eleitor" TEXT,
    "zona" TEXT,
    "secao" TEXT,
    "ctps_numero" TEXT,
    "ctps_serie" TEXT,
    "ctps_uf" TEXT,
    "ctps_data_emissao" DATE,

    CONSTRAINT "documentos_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos_profissionais" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "tipo_logradouro" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro_distrito" TEXT,
    "municipio_residencia" TEXT,
    "codigo_ibge_municipio" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "telefone" TEXT,

    CONSTRAINT "enderecos_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_bancarios_profissionais" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "banco_codigo" TEXT,
    "banco_nome" TEXT,
    "agencia" TEXT,
    "conta_corrente" TEXT,

    CONSTRAINT "dados_bancarios_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculos_profissionais" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "registro_conselho_classe" TEXT,
    "orgao_emissor" TEXT,
    "atendimento_sus" BOOLEAN NOT NULL DEFAULT false,
    "codigo_vinculacao" TEXT,
    "codigo_tipo" TEXT,
    "codigo_sub_tipo" TEXT,
    "cbo_codigo" TEXT,
    "cbo_descricao" TEXT,
    "carga_horaria_ambulatorial" INTEGER,
    "carga_horaria_hospitalar" INTEGER,
    "carga_horaria_outros" INTEGER,
    "data_entrada" DATE,
    "data_desligamento" DATE,
    "motivo_desligamento" TEXT,

    CONSTRAINT "vinculos_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_cpf_key" ON "profissionais"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_profissionais_profissional_id_key" ON "documentos_profissionais"("profissional_id");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_profissionais_profissional_id_key" ON "enderecos_profissionais"("profissional_id");

-- CreateIndex
CREATE UNIQUE INDEX "dados_bancarios_profissionais_profissional_id_key" ON "dados_bancarios_profissionais"("profissional_id");

-- AddForeignKey
ALTER TABLE "documentos_profissionais" ADD CONSTRAINT "documentos_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos_profissionais" ADD CONSTRAINT "enderecos_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dados_bancarios_profissionais" ADD CONSTRAINT "dados_bancarios_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_profissionais" ADD CONSTRAINT "vinculos_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

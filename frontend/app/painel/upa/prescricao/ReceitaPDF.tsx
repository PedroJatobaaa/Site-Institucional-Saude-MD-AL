import React, { forwardRef } from 'react';

interface ItemPrescricao {
  id: string | number;
  descricao: string;
  horario: string;
  dev: string;
}

interface ReceitaPDFProps {
  paciente: any;
  setor: string;
  leito: string;
  custo: string;
  itens: ItemPrescricao[];
  dataPrescricao?: string;
}

const ITENS_PAGINA_1 = 20;
const ITENS_PAGINAS_SEGUINTES = 22;

function criarLinhaVazia(i: number): ItemPrescricao {
  return { id: `empty-${i}`, descricao: '', horario: '', dev: '' };
}

function paginarItens(itens: ItemPrescricao[]): ItemPrescricao[][] {
  if (itens.length === 0) {
    return [Array.from({ length: ITENS_PAGINA_1 }, (_, i) => criarLinhaVazia(i))];
  }

  const paginas: ItemPrescricao[][] = [];
  const primeiraPagina = itens.slice(0, ITENS_PAGINA_1);
  const restante = itens.slice(ITENS_PAGINA_1);

  if (restante.length === 0 && primeiraPagina.length < ITENS_PAGINA_1) {
    const padded = [...primeiraPagina];
    for (let i = padded.length; i < ITENS_PAGINA_1; i++) {
      padded.push(criarLinhaVazia(i));
    }
    paginas.push(padded);
  } else {
    paginas.push(primeiraPagina);
    let offset = ITENS_PAGINA_1;
    while (offset < itens.length) {
      paginas.push(itens.slice(offset, offset + ITENS_PAGINAS_SEGUINTES));
      offset += ITENS_PAGINAS_SEGUINTES;
    }
  }

  return paginas;
}

function contarItensComDescricao(itens: ItemPrescricao[]): number {
  return itens.filter((i) => i.descricao).length;
}

function calcularIdade(dataNasc?: string) {
  if (!dataNasc) return '';
  const nascimento = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return isNaN(idade) ? '' : idade;
}

function CabecalhoInstitucional() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="w-1/3">
        <img
          src="/logo.png"
          alt="Logo Prefeitura"
          className="w-40 h-auto object-contain"
        />
      </div>
      <div className="w-2/3 text-right font-bold text-sm leading-tight">
        <p>MUNICÍPIO DE MARECHAL DEODORO</p>
        <p>UNIDADE DE PRONTO ATENDIMENTO - UPA</p>
      </div>
    </div>
  );
}

function IdentificacaoPaciente({
  paciente,
  setor,
  leito,
  custo,
}: {
  paciente: ReceitaPDFProps['paciente'];
  setor: string;
  leito: string;
  custo: string;
}) {
  return (
    <div className="border-[2px] border-black mb-6">
      <div className="flex border-b border-black">
        <div className="p-1 border-r border-black w-1/4 font-bold break-words">
          SETOR: <span className="font-normal uppercase break-words">{setor}</span>
        </div>
        <div className="p-1 border-r border-black w-2/4 font-bold break-words">
          PACIENTE: <span className="font-normal uppercase break-words">{paciente?.nome || ''}</span>
          {paciente?.cpf && (
            <span className="ml-2">
              | CPF: <span className="font-normal">{paciente?.cpf}</span>
            </span>
          )}
        </div>
        <div className="p-1 w-1/4 font-bold">
          IDADE: <span className="font-normal">{calcularIdade(paciente?.data_nascimento)}</span>
        </div>
      </div>

      <div className="flex">
        <div className="p-1 border-r border-black w-1/4 font-bold">
          DATA NASC.: <span className="font-normal">{paciente?.data_nascimento || ''}</span>
        </div>
        <div className="p-1 border-r border-black w-1/4 font-bold break-words">
          REGISTRO: <span className="font-normal uppercase break-words">{paciente?.registro_hc || ''}</span>
        </div>
        <div className="p-1 border-r border-black w-1/4 font-bold break-words">
          LEITO: <span className="font-normal uppercase break-words">{leito}</span>
        </div>
        <div className="p-1 w-1/4 font-bold break-words">
          CUSTO: <span className="font-normal uppercase break-words">{custo}</span>
        </div>
      </div>
    </div>
  );
}

function TituloPrescricao({ dataPrescricao }: { dataPrescricao?: string }) {
  const dataExibida = dataPrescricao ?? new Date().toLocaleDateString('pt-BR');
  return (
    <div className="flex justify-between items-center mb-2 px-2">
      <h2 className="text-lg font-bold mx-auto ml-32 uppercase tracking-tighter">
        Folha de Prescrição Médica
      </h2>
      <div className="font-bold text-sm">
        DATA: <span className="font-normal">{dataExibida}</span>
      </div>
    </div>
  );
}

function CabecalhoTabela() {
  return (
    <div className="flex border-b-[2px] border-black bg-gray-50 font-bold text-center">
      <div className="p-1 border-r border-black w-8">Nº</div>
      <div className="p-1 border-r border-black w-12">DEV</div>
      <div className="p-1 border-r border-black flex-1">PRESCRIÇÃO</div>
      <div className="p-1 w-48 text-center">HORÁRIOS</div>
    </div>
  );
}

function LinhaItem({ item, numero }: { item: ItemPrescricao; numero: number | '' }) {
  return (
    <div className="flex border-b border-black last:border-0 min-h-6 py-0.5 items-start">
      <div className="p-1 border-r border-black w-8 text-center font-bold">{numero}</div>
      <div className="p-1 border-r border-black w-12 text-center uppercase font-bold text-[9px]">
        {item.dev || ''}
      </div>
      <div className="p-1 border-r border-black flex-1 uppercase font-medium whitespace-normal break-words leading-tight pl-2">
        {item.descricao}
      </div>
      <div className="p-1 w-48 text-center uppercase font-medium whitespace-normal break-words leading-tight">
        {item.horario}
      </div>
    </div>
  );
}

function TabelaItens({
  itensPagina,
  offsetNumero,
  mostrarAvisoAntibioticos,
}: {
  itensPagina: ItemPrescricao[];
  offsetNumero: number;
  mostrarAvisoAntibioticos: boolean;
}) {
  let numero = offsetNumero;

  return (
    <div className="border-[2px] border-black mb-2">
      <CabecalhoTabela />
      {itensPagina.map((item) => {
        let displayNumero: number | '' = '';
        if (item.descricao) {
          numero += 1;
          displayNumero = numero;
        }
        return <LinhaItem key={item.id} item={item} numero={displayNumero} />;
      })}
      {mostrarAvisoAntibioticos && (
        <div className="border-t-[2px] border-black p-1 text-[8px] font-bold text-center uppercase">
          CONTROLE DE ANTIBIÓTICOS ( ) ASSINAR E CARIMBAR A PRESCRIÇÃO. ENFERMAGEM ASSINA E CARIMBA A CHECAGEM.
        </div>
      )}
    </div>
  );
}

function Rodape() {
  return (
    <div className="flex justify-between mt-12 px-4">
      <div className="border-[2px] border-black w-64 h-20 grid grid-cols-2 grid-rows-2 text-[10px] font-bold uppercase">
        <div className="border-r border-b border-black p-1">RECEBIDO</div>
        <div className="border-b border-black p-1">DESPACHADO</div>
        <div className="border-r border-black p-1 flex items-end">HORA:</div>
        <div className="p-1 flex items-end">HORA:</div>
      </div>

      <div className="w-64 flex flex-col items-center justify-end text-[10px] font-bold pb-2 uppercase text-center">
        <div className="w-full border-t border-black mb-1"></div>
        CARIMBO E ASSINATURA DO MÉDICO
      </div>
    </div>
  );
}

export const ReceitaPDF = forwardRef<HTMLDivElement, ReceitaPDFProps>(
  ({ paciente, setor, leito, custo, itens, dataPrescricao }, ref) => {
    const paginas = paginarItens(itens);
    const totalPaginas = paginas.length;

    let offsetNumero = 0;

    return (
      <div ref={ref} className="bg-white text-black font-sans mx-auto text-xs">
        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            .prescricao-pagina { page-break-after: always; break-after: page; }
            .prescricao-pagina:last-child { page-break-after: auto; break-after: auto; }
          }
        `}</style>

        {paginas.map((itensPagina, pageIndex) => {
          const isPrimeiraPagina = pageIndex === 0;
          const isUltimaPagina = pageIndex === totalPaginas - 1;
          const offsetAtual = offsetNumero;
          offsetNumero += contarItensComDescricao(itensPagina);

          return (
            <div
              key={pageIndex}
              className="prescricao-pagina bg-white w-[210mm] min-h-[297mm] p-8 mx-auto"
            >
              {isPrimeiraPagina && (
                <>
                  <CabecalhoInstitucional />
                  <IdentificacaoPaciente
                    paciente={paciente}
                    setor={setor}
                    leito={leito}
                    custo={custo}
                  />
                  <TituloPrescricao dataPrescricao={dataPrescricao} />
                </>
              )}

              <TabelaItens
                itensPagina={itensPagina}
                offsetNumero={offsetAtual}
                mostrarAvisoAntibioticos={isUltimaPagina}
              />

              {isUltimaPagina && <Rodape />}
            </div>
          );
        })}
      </div>
    );
  }
);

ReceitaPDF.displayName = 'ReceitaPDF';

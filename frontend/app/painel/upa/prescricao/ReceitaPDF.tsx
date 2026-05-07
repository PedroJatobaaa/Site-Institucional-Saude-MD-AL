import React, { forwardRef } from 'react';

interface ReceitaPDFProps {
  paciente: any;
  setor: string;
  leito: string;
  custo: string;
  itens: any[];
}

export const ReceitaPDF = forwardRef<HTMLDivElement, ReceitaPDFProps>(
  ({ paciente, setor, leito, custo, itens }, ref) => {
    
    const calcularIdade = (dataNasc?: string) => {
      if (!dataNasc) return '';
      const nascimento = new Date(dataNasc);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
      return isNaN(idade) ? '' : idade;
    };

    const linhasVazias = 15 - itens.length;
    const itensCompletos = [...itens];
    for (let i = 0; i < (linhasVazias > 0 ? linhasVazias : 0); i++) {
      itensCompletos.push({ id: `empty-${i}`, descricao: '', horario: '', dev: '' });
    }

    return (
      <div ref={ref} className="bg-white text-black p-8 font-sans w-[210mm] min-h-[297mm] mx-auto text-xs">
        
        {/* CABEÇALHO COM LOGO */}
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/3">
            {/* IMPORTANTE: Certifique-se de que a imagem está em /public/logo-marechal.png 
               Usamos a tag <img> pura para garantir compatibilidade total na impressão.
            */}
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

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div className="border-[2px] border-black mb-6">
          <div className="flex border-b border-black">
            <div className="p-1 border-r border-black w-1/4 font-bold">
              SETOR: <span className="font-normal uppercase">{setor}</span>
            </div>
            <div className="p-1 border-r border-black w-2/4 font-bold">
              PACIENTE: <span className="font-normal uppercase">{paciente?.nome || ''}</span>
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
            <div className="p-1 border-r border-black w-1/4 font-bold">
              REGISTRO: <span className="font-normal uppercase">{paciente?.registro_hc || ''}</span>
            </div>
            <div className="p-1 border-r border-black w-1/4 font-bold">
              LEITO: <span className="font-normal uppercase">{leito}</span>
            </div>
            <div className="p-1 w-1/4 font-bold">
              CUSTO: <span className="font-normal uppercase">{custo}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 px-2">
          <h2 className="text-lg font-bold mx-auto ml-32 uppercase tracking-tighter">Folha de Prescrição Médica</h2>
          <div className="font-bold text-sm">
            DATA: <span className="font-normal">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* TABELA DE ITENS */}
        <div className="border-[2px] border-black mb-2">
          <div className="flex border-b-[2px] border-black bg-gray-50 font-bold text-center">
            <div className="p-1 border-r border-black w-8">Nº</div>
            <div className="p-1 border-r border-black w-12">DEV</div>
            <div className="p-1 border-r border-black flex-1">PRESCRIÇÃO</div>
            <div className="p-1 w-48 text-center">HORÁRIOS</div>
          </div>

          {itensCompletos.slice(0, 15).map((item, index) => (
            <div key={item.id} className="flex border-b border-black last:border-0 h-6 items-center">
              <div className="p-1 border-r border-black w-8 text-center font-bold">
                {item.descricao ? index + 1 : ''}
              </div>
              <div className="p-1 border-r border-black w-12 text-center uppercase font-bold text-[9px]">
                {item.dev || ''}
              </div>
              <div className="p-1 border-r border-black flex-1 uppercase font-medium truncate pl-2">
                {item.descricao}
              </div>
              <div className="p-1 w-48 text-center uppercase font-medium">
                {item.horario}
              </div>
            </div>
          ))}
          
          <div className="border-t-[2px] border-black p-1 text-[8px] font-bold text-center uppercase">
            CONTROLE DE ANTIBIÓTICOS ( ) ASSINAR E CARIMBAR A PRESCRIÇÃO. ENFERMAGEM ASSINA E CARIMBA A CHECAGEM.
          </div>
        </div>

        {/* RODAPÉ */}
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
      </div>
    );
  }
);

ReceitaPDF.displayName = 'ReceitaPDF';
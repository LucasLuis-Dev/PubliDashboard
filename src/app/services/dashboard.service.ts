import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import readXlsxFile from 'read-excel-file';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private transacoes: any[] = [];

  constructor(private http: HttpClient) { }

  async carregarDadosArquivo(file: File): Promise<void> {
    try {
      // Lê o arquivo (retorna um objeto com rows e errors)
      const { rows }:any = await readXlsxFile(file).then((resposta: any) => {
        return resposta
      });
  
      this.transacoes = rows.slice(1) // Remove cabeçalho
      .map((row: any, rowIndex: any) => {
        const rowData: any = {};
        row.forEach((cell: any, colIndex: any) => {
          rowData[`col${colIndex + 1}`] = cell ?? null;
        });
        return rowData;
      });

    console.log('Dados carregados:', this.transacoes);
  
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  }

  async carregarArquivoPadrao(): Promise<void> {
    try {
      // 1. Busca o arquivo padrão como Blob
      const fileBlob = await lastValueFrom(
        this.http.get('database/database.xlsx', {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          }
        })
      );
  
      // 2. Converte Blob para File (para manter compatibilidade com a função original)
      const file = new File(
        [fileBlob],
        'database.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
  
      // 3. Reutiliza a lógica existente do carregarDadosArquivo
      await this.carregarDadosArquivo(file);
  
    } catch (error) {
      console.error('Erro ao carregar arquivo padrão:', error);
      throw error;
    }
  }

  getReceitaBrutaMensal(mes: number, ano: number): number {
    return this.transacoes
      .filter(t => new Date(t.Data).getMonth() + 1 === mes && new Date(t.Data).getFullYear() === ano && t.Entrada)
      .reduce((acc, t) => acc + t.Entrada, 0);
  }

  getDespesasMensais(mes: number, ano: number): number {
    return this.transacoes
      .filter(t => new Date(t.Data).getMonth() + 1 === mes && new Date(t.Data).getFullYear() === ano && t.Saida)
      .reduce((acc, t) => acc + t.Saida, 0);
  }

  getCustoPorContrato(cliente: string, mes: number, ano: number): number {
    return this.transacoes
      .filter(t => t.Historico.includes(cliente) && new Date(t.Data).getMonth() + 1 === mes && new Date(t.Data).getFullYear() === ano && t.Saida)
      .reduce((acc, t) => acc + t.Saida, 0);
  }

  getCustoContratosGrafico(mes: number, ano: number): any[] {
    const clientes = Array.from(new Set(this.transacoes.map(t => t.Historico)));
    return clientes.map(cliente => ({
      name: cliente,
      value: this.getCustoPorContrato(cliente, mes, ano)
    })).filter(item => item.value > 0);
  }

  getDespesasGrafico(mes: number, ano: number): any[] {
    return this.transacoes
      .filter(t => new Date(t.Data).getMonth() + 1 === mes && new Date(t.Data).getFullYear() === ano && t.Saida)
      .map(t => ({
        name: t.Historico,
        value: t.Saida
      }));
  }

  getLucroMensalGrafico(mes: number, ano: number): any {
    const receita = this.getReceitaBrutaMensal(mes, ano);
    const despesas = this.getDespesasMensais(mes, ano);
    return {
      name: `Lucro ${mes}/${ano}`,
      value: receita - despesas
    };
  }

  getReceitaBrutaGrafico(ano: number): any[] {
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);
    return meses.map(mes => ({
      name: `Mês ${mes}`,
      value: this.getReceitaBrutaMensal(mes, ano)
    }));
  }

  getResumoUltimoMes(): any {
    if (this.transacoes.length === 0) return null;

    const ultimaData = new Date(Math.max(...this.transacoes.map(t => new Date(t.Data).getTime())));
    const ultimoMes = ultimaData.getMonth() + 1;
    const ultimoAno = ultimaData.getFullYear();

    const receita = this.getReceitaBrutaMensal(ultimoMes, ultimoAno);
    const despesas = this.getDespesasMensais(ultimoMes, ultimoAno);
    const lucro = receita - despesas;

    return {
      mes: ultimoMes,
      ano: ultimoAno,
      saldoTotal: receita - despesas,
      receitaBruta: receita,
      despesasTotais: despesas,
      lucro: lucro
    };
  }
}

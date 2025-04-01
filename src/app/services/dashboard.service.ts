import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import readXlsxFile from 'read-excel-file';
import { lastValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private transacoes: any[] = [];

  constructor(private http: HttpClient) { }

  private nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  async carregarDadosArquivo(file: File): Promise<void> {
    try {
      // Lê o arquivo e obtém as linhas diretamente
      const rows = await readXlsxFile(file);
  
      // Extrai o cabeçalho (primeira linha)
      const cabecalho = rows[0];
  
      // Mapeia as linhas para objetos com propriedades nomeadas
      this.transacoes = rows.slice(1).map((row) => {
        const transacao: any = {};
        cabecalho.forEach((coluna, index) => {
          const nomePropriedade = String(coluna)
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
          transacao[nomePropriedade] = row[index] ?? null;
        });
        return transacao;
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

  calcularReceitaMensal(mes: number, ano: number): Observable<any> {
    return new Observable(observer => {
      // Validações
      if (!this.transacoes?.length) {
        console.warn('Nenhuma transação disponível');
        observer.next(null);
        observer.complete();
        return;
      }
  
      if (mes < 1 || mes > 12 || isNaN(mes)) {
        console.warn('Mês inválido');
        observer.next(null);
        observer.complete();
        return;
      }
  
      if (ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        console.warn('Ano inválido');
        observer.next(null);
        observer.complete();
        return;
      }
  
      let valorTotal = 0;
      let transacoesValidas = 0;
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.entrada === undefined) continue;
  
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            valorTotal += Number(transacao.entrada) || 0;
            transacoesValidas++;
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      observer.next({
        mes: this.nomesMeses[mes - 1] || `Mês ${mes}`,
        valor: parseFloat(valorTotal.toFixed(2)),
        ano,
        mesNumero: mes,
        quantidadeTransacoes: transacoesValidas
      });
  
      observer.complete();
    });
  }

  calcularDespesasMensal(mes: number, ano: number): Observable<number> {
    return new Observable(observer => {
      if (!this.transacoes?.length) {
        console.warn('Nenhuma transação disponível');
        observer.next(0);
        observer.complete();
        return;
      }

      if (mes < 1 || mes > 12 || isNaN(mes)) {
        console.warn('Mês inválido');
        observer.next(0);
        observer.complete();
        return;
      }

      if (ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        console.warn('Ano inválido');
        observer.next(0);
        observer.complete();
        return;
      }

      let totalDespesas = 0;

      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.saida === undefined) continue;

          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            totalDespesas += Number(transacao.saida) || 0;
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }

      observer.next(parseFloat(totalDespesas.toFixed(2)));
      observer.complete();
    });
  }

  calcularLucroMensal(mes: number, ano: number): Observable<number> {
    return new Observable(observer => {
      if (!this.transacoes?.length) {
        console.warn('Nenhuma transação disponível');
        observer.next(0);
        observer.complete();
        return;
      }
  
      if (mes < 1 || mes > 12 || isNaN(mes)) {
        console.warn('Mês inválido');
        observer.next(0);
        observer.complete();
        return;
      }
  
      if (ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        console.warn('Ano inválido');
        observer.next(0);
        observer.complete();
        return;
      }
  
      let totalLucro = 0;
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.entrada === undefined || transacao.saida === undefined) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            // Lucro é a diferença entre as entradas e as saídas
            totalLucro += (Number(transacao.entrada) || 0) - (Number(transacao.saida) || 0);
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      observer.next(parseFloat(totalLucro.toFixed(2)));
      observer.complete();
    });
  }


  calcularSaldoMensal(mes: number, ano: number): Observable<number> {
    return new Observable(observer => {
      if (!this.transacoes?.length) {
        console.warn('Nenhuma transação disponível');
        observer.next(0);
        observer.complete();
        return;
      }
  
      if (mes < 1 || mes > 12 || isNaN(mes)) {
        console.warn('Mês inválido');
        observer.next(0);
        observer.complete();
        return;
      }
  
      if (ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        console.warn('Ano inválido');
        observer.next(0);
        observer.complete();
        return;
      }
  
      let totalEntradas = 0;
      let totalSaidas = 0;
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.entrada === undefined || transacao.saida === undefined) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            // Soma as entradas e as saídas separadamente
            totalEntradas += (Number(transacao.entrada) || 0);
            totalSaidas += (Number(transacao.saida) || 0);
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // O saldo é a diferença entre entradas e saídas
      const saldo = totalEntradas - totalSaidas;
      
      observer.next(parseFloat(saldo.toFixed(2)));
      observer.complete();
    });
  }

  calcularCustoPorCliente(mes: number, ano: number): Observable<{ cliente: string, custo: number }[]> {
    return new Observable(observer => {
      if (!this.transacoes?.length) {
        console.warn('Nenhuma transação disponível');
        observer.next([]);
        observer.complete();
        return;
      }
  
      if (mes < 1 || mes > 12 || isNaN(mes)) {
        console.warn('Mês inválido');
        observer.next([]);
        observer.complete();
        return;
      }
  
      if (ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        console.warn('Ano inválido');
        observer.next([]);
        observer.complete();
        return;
      }
  
      const custosPorCliente: { [key: string]: number } = {};
  
      // Filtra transações para o mês e ano especificados
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.saida === undefined) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          // Verifica se a transação pertence ao mês e ano informados
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {

            // O nome do cliente pode ser o "Nome Natureza" ou outro campo
            const nomeCliente = transacao.nome_natureza || 'Cliente desconhecido';
  
            // Acumula o custo para o cliente
            if (!custosPorCliente[nomeCliente]) {
              custosPorCliente[nomeCliente] = 0;
            }
  
            custosPorCliente[nomeCliente] += (Number(transacao.saida) || 0);
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // Transforma o objeto em um array de resultados
      const resultado = Object.keys(custosPorCliente).map(cliente => ({
        cliente,
        custo: parseFloat(custosPorCliente[cliente].toFixed(2))
      }));
  
      observer.next(resultado);
      observer.complete();
    });
  }



  getReceitaBrutaMensal(mes: number, ano: number): number {
    // Validação dos parâmetros de entrada
    if (!this.transacoes || this.transacoes.length === 0) {
        console.warn('Nenhuma transação disponível para cálculo');
        return 0;
    }

    if (isNaN(mes) || mes < 1 || mes > 12) {
        console.warn(`Mês inválido: ${mes}`);
        return 0;
    }

    if (isNaN(ano) || ano < 2000 || ano > new Date().getFullYear() + 1) {
        console.warn(`Ano inválido: ${ano}`);
        return 0;
    }

    try {
        return this.transacoes
            .filter(t => {
                try {
                    // Verifica se a transação tem data e entrada válidas
                    if (!t?.Data || !t?.Entrada) return false;
                    
                    const dataTransacao = new Date(t.Data);
                    if (isNaN(dataTransacao.getTime())) return false;
                    
                    return (dataTransacao.getMonth() + 1 === mes) && 
                           (dataTransacao.getFullYear() === ano) && 
                           (typeof t.Entrada === 'number');
                } catch (e) {
                    console.warn('Erro ao processar transação:', t, e);
                    return false;
                }
            })
            .reduce((acc, t) => {
                const entrada = Number(t.Entrada) || 0;
                return acc + entrada;
            }, 0);
    } catch (error) {
        console.error(`Erro ao calcular receita bruta para mês ${mes}, ano ${ano}:`, error);
        return 0;
    }
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
    // Check if transactions exist
    if (!this.transacoes || this.transacoes.length === 0) {
      console.warn('No transactions data available');
      return [];
    }
  
    // Get unique client names safely
    const clientes = Array.from(
      new Set(
        this.transacoes
          .map(t => t?.Historico) // Safe property access
          .filter(historico => historico !== undefined && historico !== null) // Remove undefined/null
      )
    );
  
    // Calculate costs with error handling
    return clientes
      .map(cliente => {
        try {
          const value = this.getCustoPorContrato(cliente, mes, ano);
          return { name: cliente, value: value || 0 }; // Default to 0 if undefined
        } catch (error) {
          console.error(`Error calculating cost for ${cliente}:`, error);
          return { name: cliente, value: 0 }; // Return 0 if error occurs
        }
      })
      .filter(item => item.value > 0); // Only include positive values
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

  getReceitaBrutaGrafico(ano: number, mes: number): any[] {
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

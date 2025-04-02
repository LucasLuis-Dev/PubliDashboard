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

  primeiraDataDisponivel: Date | null = null;
  ultimaDataDisponivel: Date | null = null;

  async carregarDadosArquivo(file: File): Promise<void> {
    try {
      // Lê o arquivo e obtém as linhas diretamente
      const rows = await readXlsxFile(file);
  
      if (!rows.length) {
        console.warn("O arquivo está vazio.");
        return;
      }
  
      // Extrai o cabeçalho (primeira linha)
      const cabecalho = rows[0];
  
      let primeiraData: Date | null = null;
      let ultimaData: Date | null = null; // Variável para armazenar a última data
  
      // Mapeia as linhas para objetos com propriedades nomeadas
      this.transacoes = rows.slice(1).map((row: any) => {
        const transacao: any = {};
        cabecalho.forEach((coluna, index) => {
          const nomePropriedade = String(coluna)
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .toLowerCase();
  
          transacao[nomePropriedade] = row[index] ?? null;
  
          // Verifica se a propriedade atual representa a data
          if (nomePropriedade.includes("data") && row[index]) {
            const data = new Date(row[index]);
  
            // Se for uma data válida, verifica se é a maior até agora
            if (!isNaN(data.getTime())) {
              if (!ultimaData || data > ultimaData) {
                ultimaData = data;
              }

              if (!primeiraData || data < primeiraData) {
                primeiraData = data;
              }
            }
          }
        });
        return transacao;
      });
  
      // Salva a última data encontrada
      this.primeiraDataDisponivel = primeiraData;
      this.ultimaDataDisponivel = ultimaData;
  
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  }

  obterTransacoes() {
    return this.transacoes || [];
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


  retornarPeriodoDatas() {
    return {
      primeiraData: this.primeiraDataDisponivel,
      ultimaData: this.ultimaDataDisponivel
    };
  }
  calcularReceitaMensal(mes: number, ano: number): Observable<number | string> {
    return new Observable(observer => {
      // Validações
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
  
      observer.next(this.formatarParaReal(parseFloat(valorTotal.toFixed(2))));
  
      observer.complete();
    });
  }

  calcularDespesasMensal(mes: number, ano: number): Observable<number | string> {
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
      const despesasNaoCustos = [
        // ===== DESPESAS ADMINISTRATIVAS (21102) =====
        "VIAGENS E ESTADIAS",
        "CONDUCAO E TRANSPORTE",
        "LANCHES E REFEICOES",
        "CONFRATERNIZACAO",
        "BENS DE PEQUENO VALOR",
        "CORREIOS E MALOTES",
        "FOTOCOPIAS E REPRODUCOES",
        "ASSINATURAS DE JORNAIS E REVIS",
        "EMOLUMENTOS CARTORIOS",
        "CERTIFICADO DIGITAL",
        "REEMBOLSOS",
        "OUTRAS DESPESAS",
      
        // ===== DESPESAS GERAIS (21103) =====
        "ALUGUEL DE IMOVEIS",
        "ALUGUEL DE VEICULOS",
        "ENERGIA ELETRICA",
        "AGUA E ESGOTO",
        "TELEFONIA FIXA",
        "TELEFONIA MOVEL",
        "INTERNET",
        "CONDOMINIO",
        "MATERIAL DE COPA E COZINHA",
        "MATERIAL DE EXPEDIENTE",
        "MATERIAL DE HIGIENE E LIMPEZA",
      
        // ===== DESPESAS COM PESSOAL (21104 - não alocadas a produção) =====
        "VALE REFEICAO ALIMENTACAO",
        "ASSISTENCIA MEDICA",
        "ASSISTENCIA ODONTOLOGICA",
        "SEGURO DE VIDA EM GRUPO",
        "AUXILIO CRECHE",
        "AUXILIO EDUCACAO",
        "PREVIDENCIA PRIVADA",
        "BOLSA DE ESTAGIARIOS",
        "VALE TRANSPORTE",
      
        // ===== DESPESAS COM DIRIGENTES (21105) =====
        "LUCRO DISTRIBUIDO - CARLOS HEN",
        "LUCRO DISTRIBUIDO - MATEUS MAC",
        "ADIANT. DE LUCRO - CARLOS HENR",
        "ADIANT. DE LUCRO - MATEUS MACI",
        "LUCRO DISTRIBUIDO - MANOEL VIR",
        "ADIANT. DE LUCRO - MANOEL VIRG",
      
        // ===== TRIBUTOS NÃO OPERACIONAIS (21107/21108/21109) =====
        "IPTU IMP PREDIAL TERRIT URBANO",
        "TAXAS DE BOMBEIRO",
        "ALVARA DE LOCALIZACAO",
      
        // ===== DESPESAS FINANCEIRAS (21201) =====
        "DESPESAS DE JUROS",
      
        // ===== DESPESAS NÃO OPERACIONAIS (299) =====
        "INDENIZACOES PAGAS"
      ];

      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.saida === undefined || !transacao.nome_natureza) continue;

          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

          if (despesasNaoCustos.includes(transacao.nome_natureza)) {
            if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
              totalDespesas += Number(transacao.saida) || 0;
            }
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }

      observer.next(this.formatarParaReal(parseFloat(totalDespesas.toFixed(2))));
      observer.complete();
    });
  }

  calcularCustoMensal(mes: number, ano: number): Observable<number | string> {
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

      let totalCustos = 0;
      const custos = [
        // ===== SERVIÇOS PRESTADOS (21101) =====
        "AUDITORIA",
        "CONSULTORIA",
        "ASSESSORIA JURIDICA",
        "ASSESSORIA CONTABIL",
        "SERVICOS INFORMATICA",
        "SERVICOS SEGURANCA",
        "SERVICOS LIMPEZA E CONSERVACAO",
        "SERVICOS SEGURANCA DO TRABALHO",
        "SERVICOS GRAFICOS",
        "SERVICOS DE ENTREGA",
        "FRETES E CARRETOS",
        "SERVICOS DE PUBLICIDADE E PROP",
        "SERVICO DE DIVULGACAO",
        "SERVICO FORNECIMENTO DE DADOS",
        "SERVICOS DEDETIZACAO",
      
        // ===== MÃO DE OBRA DIRETA (21104) =====
        "SALARIOS E ORDENADOS",
        "HORA EXTRA 50%",
        "HORA EXTRA 100%",
        "COMISSOES",
        "FARDAMENTO",
        "ALUGUEL DE IMOVEIS",
        "CONDOMINIO",
        "EXAMES MEDICOS", // (se vinculados à equipe operacional)
      
        // ===== MATERIAIS/REFORMAS (21106) =====
        "MATERIAL DE REFORMAS",
        "SERV DE REFORMAS",
        "MATERIAL DE MANUTENCAO",
        "SERV DE MANUTENCAO",
      
        // ===== TRIBUTOS SOBRE OPERAÇÕES (21107/21109) =====
        "ISS",
        "ISS RETIDO NA FONTE",
        "IRRF SERVICOS",
        "PIS",
        "COFINS",
        "IRPJ",
        "CSLL",
      
        // ===== DESPESAS COMERCIAIS (21111) =====
        "COMISSOES",
        "BRINDES E PRESENTES",
      
        // ===== MULTAS CONTRATUAIS (21110) =====
        "MULTAS COMPENSATORIAS POR ATRA",
        "MULTAS CONTRATUAIS PASSIVAS",
      
        // ===== LICENÇAS/SOFTWARES OPERACIONAIS (21103) =====
        "LICENCA DE USO",
        "HOSPEDAGEM DE DOMINIO",
        "SOFTWARES",
      
        // ===== PRO LABORE (21105 - se vinculado a atividades operacionais) =====
        "PRO LABORE"
      ];

      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.saida === undefined || !transacao.nome_natureza) continue;

          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

          if (custos.includes(transacao.nome_natureza)) {
            if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
              totalCustos += Number(transacao.saida) || 0;
            }
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }

      observer.next(this.formatarParaReal(parseFloat(totalCustos.toFixed(2))));
      observer.complete();
    });
  }


  calcularLucroMensal(mes: number, ano: number): Observable<number | string> {
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
      let receitaTotal = 0;
      let despesaTotal = 0

      const despesas = [
        // ===== DESPESAS ADMINISTRATIVAS (21102) =====
        "VIAGENS E ESTADIAS",
        "CONDUCAO E TRANSPORTE",
        "LANCHES E REFEICOES",
        "CONFRATERNIZACAO",
        "BENS DE PEQUENO VALOR",
        "CORREIOS E MALOTES",
        "FOTOCOPIAS E REPRODUCOES",
        "ASSINATURAS DE JORNAIS E REVIS",
        "EMOLUMENTOS CARTORIOS",
        "CERTIFICADO DIGITAL",
        "REEMBOLSOS",
        "OUTRAS DESPESAS",
      
        // ===== DESPESAS GERAIS (21103) =====
        "ALUGUEL DE IMOVEIS",
        "ALUGUEL DE VEICULOS",
        "ENERGIA ELETRICA",
        "AGUA E ESGOTO",
        "TELEFONIA FIXA",
        "TELEFONIA MOVEL",
        "INTERNET",
        "CONDOMINIO",
        "MATERIAL DE COPA E COZINHA",
        "MATERIAL DE EXPEDIENTE",
        "MATERIAL DE HIGIENE E LIMPEZA",
      
        // ===== DESPESAS COM PESSOAL (21104 - não alocadas a produção) =====
        "VALE REFEICAO ALIMENTACAO",
        "ASSISTENCIA MEDICA",
        "ASSISTENCIA ODONTOLOGICA",
        "SEGURO DE VIDA EM GRUPO",
        "AUXILIO CRECHE",
        "AUXILIO EDUCACAO",
        "PREVIDENCIA PRIVADA",
        "BOLSA DE ESTAGIARIOS",
        "VALE TRANSPORTE",
      
        // ===== DESPESAS COM DIRIGENTES (21105) =====
        "LUCRO DISTRIBUIDO - CARLOS HEN",
        "LUCRO DISTRIBUIDO - MATEUS MAC",
        "ADIANT. DE LUCRO - CARLOS HENR",
        "ADIANT. DE LUCRO - MATEUS MACI",
        "LUCRO DISTRIBUIDO - MANOEL VIR",
        "ADIANT. DE LUCRO - MANOEL VIRG",
      
        // ===== TRIBUTOS NÃO OPERACIONAIS (21107/21108/21109) =====
        "IPTU IMP PREDIAL TERRIT URBANO",
        "TAXAS DE BOMBEIRO",
        "ALVARA DE LOCALIZACAO",
      
        // ===== DESPESAS FINANCEIRAS (21201) =====
        "DESPESAS DE JUROS",
      
        // ===== DESPESAS NÃO OPERACIONAIS (299) =====
        "INDENIZACOES PAGAS",

        // ===== SERVIÇOS PRESTADOS (21101) =====
        "AUDITORIA",
        "CONSULTORIA",
        "ASSESSORIA JURIDICA",
        "ASSESSORIA CONTABIL",
        "SERVICOS INFORMATICA",
        "SERVICOS SEGURANCA",
        "SERVICOS LIMPEZA E CONSERVACAO",
        "SERVICOS SEGURANCA DO TRABALHO",
        "SERVICOS GRAFICOS",
        "SERVICOS DE ENTREGA",
        "FRETES E CARRETOS",
        "SERVICOS DE PUBLICIDADE E PROP",
        "SERVICO DE DIVULGACAO",
        "SERVICO FORNECIMENTO DE DADOS",
        "SERVICOS DEDETIZACAO",
      
        // ===== MÃO DE OBRA DIRETA (21104) =====
        "SALARIOS E ORDENADOS",
        "HORA EXTRA 50%",
        "HORA EXTRA 100%",
        "COMISSOES",
        "FARDAMENTO",
        "ALUGUEL DE IMOVEIS",
        "CONDOMINIO",
        "EXAMES MEDICOS", // (se vinculados à equipe operacional)
      
        // ===== MATERIAIS/REFORMAS (21106) =====
        "MATERIAL DE REFORMAS",
        "SERV DE REFORMAS",
        "MATERIAL DE MANUTENCAO",
        "SERV DE MANUTENCAO",
      
        // ===== TRIBUTOS SOBRE OPERAÇÕES (21107/21109) =====
        "ISS",
        "ISS RETIDO NA FONTE",
        "IRRF SERVICOS",
        "PIS",
        "COFINS",
        "IRPJ",
        "CSLL",
      
        // ===== DESPESAS COMERCIAIS (21111) =====
        "COMISSOES",
        "BRINDES E PRESENTES",
      
        // ===== MULTAS CONTRATUAIS (21110) =====
        "MULTAS COMPENSATORIAS POR ATRA",
        "MULTAS CONTRATUAIS PASSIVAS",
      
        // ===== LICENÇAS/SOFTWARES OPERACIONAIS (21103) =====
        "LICENCA DE USO",
        "HOSPEDAGEM DE DOMINIO",
        "SOFTWARES",
      
        // ===== PRO LABORE (21105 - se vinculado a atividades operacionais) =====
        "PRO LABORE"
      ];
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.entrada === undefined || transacao.saida === undefined || !transacao.nome_natureza) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

        
            if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
              // Lucro é a diferença entre as entradas e as saídas
              receitaTotal += Number(transacao.entrada) || 0;

              if (despesas.includes(transacao.nome_natureza)) { 
                despesaTotal += Number(transacao.saida) || 0;
              }
            }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }

      totalLucro = receitaTotal - despesaTotal;
  
      observer.next(this.formatarParaReal(parseFloat(totalLucro.toFixed(2))));
      observer.complete();
    });
  }


  calcularSaldoMensal(mes: number, ano: number): Observable<string | number> {
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
  
      let saldoInicial = 0;
      let entradasSaldoInicial = 0;
      let saidasSaldoInicial = 0;

      let totalEntradas = 0;
      let totalSaidas = 0;

      const despesas = [
        // ===== DESPESAS ADMINISTRATIVAS (21102) =====
        "VIAGENS E ESTADIAS",
        "CONDUCAO E TRANSPORTE",
        "LANCHES E REFEICOES",
        "CONFRATERNIZACAO",
        "BENS DE PEQUENO VALOR",
        "CORREIOS E MALOTES",
        "FOTOCOPIAS E REPRODUCOES",
        "ASSINATURAS DE JORNAIS E REVIS",
        "EMOLUMENTOS CARTORIOS",
        "CERTIFICADO DIGITAL",
        "REEMBOLSOS",
        "OUTRAS DESPESAS",
      
        // ===== DESPESAS GERAIS (21103) =====
        "ALUGUEL DE IMOVEIS",
        "ALUGUEL DE VEICULOS",
        "ENERGIA ELETRICA",
        "AGUA E ESGOTO",
        "TELEFONIA FIXA",
        "TELEFONIA MOVEL",
        "INTERNET",
        "CONDOMINIO",
        "MATERIAL DE COPA E COZINHA",
        "MATERIAL DE EXPEDIENTE",
        "MATERIAL DE HIGIENE E LIMPEZA",
      
        // ===== DESPESAS COM PESSOAL (21104 - não alocadas a produção) =====
        "VALE REFEICAO ALIMENTACAO",
        "ASSISTENCIA MEDICA",
        "ASSISTENCIA ODONTOLOGICA",
        "SEGURO DE VIDA EM GRUPO",
        "AUXILIO CRECHE",
        "AUXILIO EDUCACAO",
        "PREVIDENCIA PRIVADA",
        "BOLSA DE ESTAGIARIOS",
        "VALE TRANSPORTE",
      
        // ===== DESPESAS COM DIRIGENTES (21105) =====
        "LUCRO DISTRIBUIDO - CARLOS HEN",
        "LUCRO DISTRIBUIDO - MATEUS MAC",
        "ADIANT. DE LUCRO - CARLOS HENR",
        "ADIANT. DE LUCRO - MATEUS MACI",
        "LUCRO DISTRIBUIDO - MANOEL VIR",
        "ADIANT. DE LUCRO - MANOEL VIRG",
      
        // ===== TRIBUTOS NÃO OPERACIONAIS (21107/21108/21109) =====
        "IPTU IMP PREDIAL TERRIT URBANO",
        "TAXAS DE BOMBEIRO",
        "ALVARA DE LOCALIZACAO",
      
        // ===== DESPESAS FINANCEIRAS (21201) =====
        "DESPESAS DE JUROS",
      
        // ===== DESPESAS NÃO OPERACIONAIS (299) =====
        "INDENIZACOES PAGAS",

        // ===== SERVIÇOS PRESTADOS (21101) =====
        "AUDITORIA",
        "CONSULTORIA",
        "ASSESSORIA JURIDICA",
        "ASSESSORIA CONTABIL",
        "SERVICOS INFORMATICA",
        "SERVICOS SEGURANCA",
        "SERVICOS LIMPEZA E CONSERVACAO",
        "SERVICOS SEGURANCA DO TRABALHO",
        "SERVICOS GRAFICOS",
        "SERVICOS DE ENTREGA",
        "FRETES E CARRETOS",
        "SERVICOS DE PUBLICIDADE E PROP",
        "SERVICO DE DIVULGACAO",
        "SERVICO FORNECIMENTO DE DADOS",
        "SERVICOS DEDETIZACAO",
      
        // ===== MÃO DE OBRA DIRETA (21104) =====
        "SALARIOS E ORDENADOS",
        "HORA EXTRA 50%",
        "HORA EXTRA 100%",
        "COMISSOES",
        "FARDAMENTO",
        "ALUGUEL DE IMOVEIS",
        "CONDOMINIO",
        "EXAMES MEDICOS", // (se vinculados à equipe operacional)
      
        // ===== MATERIAIS/REFORMAS (21106) =====
        "MATERIAL DE REFORMAS",
        "SERV DE REFORMAS",
        "MATERIAL DE MANUTENCAO",
        "SERV DE MANUTENCAO",
      
        // ===== TRIBUTOS SOBRE OPERAÇÕES (21107/21109) =====
        "ISS",
        "ISS RETIDO NA FONTE",
        "IRRF SERVICOS",
        "PIS",
        "COFINS",
        "IRPJ",
        "CSLL",
      
        // ===== DESPESAS COMERCIAIS (21111) =====
        "COMISSOES",
        "BRINDES E PRESENTES",
      
        // ===== MULTAS CONTRATUAIS (21110) =====
        "MULTAS COMPENSATORIAS POR ATRA",
        "MULTAS CONTRATUAIS PASSIVAS",
      
        // ===== LICENÇAS/SOFTWARES OPERACIONAIS (21103) =====
        "LICENCA DE USO",
        "HOSPEDAGEM DE DOMINIO",
        "SOFTWARES",
      
        // ===== PRO LABORE (21105 - se vinculado a atividades operacionais) =====
        "PRO LABORE"
      ];
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || transacao.entrada === undefined || transacao.saida === undefined || !transacao.nome_natureza) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            // Soma as entradas e as saídas separadamente
            totalEntradas += (Number(transacao.entrada) || 0);
            if (despesas.includes(transacao.nome_natureza)) { 
              totalSaidas += (Number(transacao.saida) || 0);
            }
            
          } else if (data.getMonth() + 1 === (mes - 1) && data.getFullYear() === ano) {
            entradasSaldoInicial += (Number(transacao.entrada) || 0);
            if (despesas.includes(transacao.nome_natureza)) { 
              saidasSaldoInicial += (Number(transacao.saida) || 0);
            }           
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }

      saldoInicial = entradasSaldoInicial - saidasSaldoInicial;
  
      // O saldo é a diferença entre entradas e saídas
      const saldo = saldoInicial + (totalEntradas - totalSaidas);
      
      observer.next(this.formatarParaReal(Number(saldo.toFixed(2))));
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
          if (!transacao?.data || !transacao.saida) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          // Verifica se a transação pertence ao mês e ano informados
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {

            const saidasContratosClientes = [
              "AUDITORIA",
              "CONSULTORIA",
              "ASSESSORIA JURIDICA",
              "ASSESSORIA CONTABIL",
              "SERVICOS INFORMATICA",
              "SERVICOS SEGURANCA",
              "SERVICOS DE ENTREGA",
              "FRETES E CARRETOS",
              "SERVICOS DE PUBLICIDADE E PROP",
              "SERVICO DE DIVULGACAO",
              "VIAGENS E ESTADIAS",
              "REEMBOLSOS",
              "TAXAS E CUSTAS PROCESSUAIS",
              "LICENCA DE USO",
              "COMISSOES",
              "BRINDES E PRESENTES",
              "MULTAS COMPENSATORIAS POR ATRA",
              "MULTAS CONTRATUAIS PASSIVAS",
              "SALARIOS E ORDENADOS",
              "CURSOS E TREINAMENTOS",
              "IRRF SERVICOS",
              "ISS",
              "ISS RETIDO NA FONTE",
              "MARKETING DIRETO",
              "CONSULTORIA EM PUBLICIDADE"
            ];

            // O nome do cliente pode ser o "Nome Natureza" ou outro campo
            const nomeCliente = transacao.nome_natureza || 'Cliente desconhecido';

            if (saidasContratosClientes.includes(nomeCliente)) {
              // Acumula o custo para o cliente
              if (!custosPorCliente[nomeCliente]) {
                custosPorCliente[nomeCliente] = 0;
              }

              custosPorCliente[nomeCliente] += (Number(transacao.saida) || 0);
            }
  
            
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


  obterDespesasDetalhadas(mes: number, ano: number): Observable<{ nomeNatureza: string, valor: number }[]> {
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
  
      // Objeto para armazenar despesas agrupadas por nome_natureza
      const despesasAgrupadas: { [key: string]: number } = {};
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || !transacao.saida || !transacao.nome_natureza) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

          const despesasNaoCustos = [
            // ===== DESPESAS ADMINISTRATIVAS (21102) =====
            "VIAGENS E ESTADIAS",
            "CONDUCAO E TRANSPORTE",
            "LANCHES E REFEICOES",
            "CONFRATERNIZACAO",
            "BENS DE PEQUENO VALOR",
            "CORREIOS E MALOTES",
            "FOTOCOPIAS E REPRODUCOES",
            "ASSINATURAS DE JORNAIS E REVIS",
            "EMOLUMENTOS CARTORIOS",
            "CERTIFICADO DIGITAL",
            "REEMBOLSOS",
            "OUTRAS DESPESAS",
          
            // ===== DESPESAS GERAIS (21103) =====
            "ALUGUEL DE IMOVEIS",
            "ALUGUEL DE VEICULOS",
            "ENERGIA ELETRICA",
            "AGUA E ESGOTO",
            "TELEFONIA FIXA",
            "TELEFONIA MOVEL",
            "INTERNET",
            "CONDOMINIO",
            "MATERIAL DE COPA E COZINHA",
            "MATERIAL DE EXPEDIENTE",
            "MATERIAL DE HIGIENE E LIMPEZA",
          
            // ===== DESPESAS COM PESSOAL (21104 - não alocadas a produção) =====
            "VALE REFEICAO ALIMENTACAO",
            "ASSISTENCIA MEDICA",
            "ASSISTENCIA ODONTOLOGICA",
            "SEGURO DE VIDA EM GRUPO",
            "AUXILIO CRECHE",
            "AUXILIO EDUCACAO",
            "PREVIDENCIA PRIVADA",
            "BOLSA DE ESTAGIARIOS",
            "VALE TRANSPORTE",
          
            // ===== DESPESAS COM DIRIGENTES (21105) =====
            "LUCRO DISTRIBUIDO - CARLOS HEN",
            "LUCRO DISTRIBUIDO - MATEUS MAC",
            "ADIANT. DE LUCRO - CARLOS HENR",
            "ADIANT. DE LUCRO - MATEUS MACI",
            "LUCRO DISTRIBUIDO - MANOEL VIR",
            "ADIANT. DE LUCRO - MANOEL VIRG",
          
            // ===== TRIBUTOS NÃO OPERACIONAIS (21107/21108/21109) =====
            "IPTU IMP PREDIAL TERRIT URBANO",
            "TAXAS DE BOMBEIRO",
            "ALVARA DE LOCALIZACAO",
          
            // ===== DESPESAS FINANCEIRAS (21201) =====
            "DESPESAS DE JUROS",
          
            // ===== DESPESAS NÃO OPERACIONAIS (299) =====
            "INDENIZACOES PAGAS"
          ];
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            const nomeNatureza = transacao.nome_natureza;
            if(despesasNaoCustos.includes(nomeNatureza)) {
              const valorSaida = Number(transacao.saida) || 0;
  
              // Soma os valores de despesas com o mesmo nome_natureza
              despesasAgrupadas[nomeNatureza] = (despesasAgrupadas[nomeNatureza] || 0) + valorSaida;
            }
            
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // Converte o objeto agrupado para um array de objetos e emite o resultado
      const resultado = Object.keys(despesasAgrupadas).map(nomeNatureza => ({
        nomeNatureza,
        valor: parseFloat(despesasAgrupadas[nomeNatureza].toFixed(2)) // Formata para 2 casas decimais
      }));
  
      observer.next(resultado);
      observer.complete();
    });
  }

  obterCustosDetalhadas(mes: number, ano: number): Observable<{ nomeNatureza: string, valor: number }[]> {
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
  
      // Objeto para armazenar despesas agrupadas por nome_natureza
      const custosAgrupados: { [key: string]: number } = {};
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || !transacao.saida || !transacao.nome_natureza) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;

          const custos = [
            // ===== SERVIÇOS PRESTADOS (21101) =====
            "AUDITORIA",
            "CONSULTORIA",
            "ASSESSORIA JURIDICA",
            "ASSESSORIA CONTABIL",
            "SERVICOS INFORMATICA",
            "SERVICOS SEGURANCA",
            "SERVICOS LIMPEZA E CONSERVACAO",
            "SERVICOS SEGURANCA DO TRABALHO",
            "SERVICOS GRAFICOS",
            "SERVICOS DE ENTREGA",
            "FRETES E CARRETOS",
            "SERVICOS DE PUBLICIDADE E PROP",
            "SERVICO DE DIVULGACAO",
            "SERVICO FORNECIMENTO DE DADOS",
            "SERVICOS DEDETIZACAO",
          
            // ===== MÃO DE OBRA DIRETA (21104) =====
            "SALARIOS E ORDENADOS",
            "HORA EXTRA 50%",
            "HORA EXTRA 100%",
            "COMISSOES",
            "FARDAMENTO",
            "ALUGUEL DE IMOVEIS",
            "CONDOMINIO",
            "EXAMES MEDICOS", // (se vinculados à equipe operacional)
          
            // ===== MATERIAIS/REFORMAS (21106) =====
            "MATERIAL DE REFORMAS",
            "SERV DE REFORMAS",
            "MATERIAL DE MANUTENCAO",
            "SERV DE MANUTENCAO",
          
            // ===== TRIBUTOS SOBRE OPERAÇÕES (21107/21109) =====
            "ISS",
            "ISS RETIDO NA FONTE",
            "IRRF SERVICOS",
            "PIS",
            "COFINS",
            "IRPJ",
            "CSLL",
          
            // ===== DESPESAS COMERCIAIS (21111) =====
            "COMISSOES",
            "BRINDES E PRESENTES",
          
            // ===== MULTAS CONTRATUAIS (21110) =====
            "MULTAS COMPENSATORIAS POR ATRA",
            "MULTAS CONTRATUAIS PASSIVAS",
          
            // ===== LICENÇAS/SOFTWARES OPERACIONAIS (21103) =====
            "LICENCA DE USO",
            "HOSPEDAGEM DE DOMINIO",
            "SOFTWARES",
          
            // ===== PRO LABORE (21105 - se vinculado a atividades operacionais) =====
            "PRO LABORE"
          ];
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            const nomeNatureza = transacao.nome_natureza;
            if(custos.includes(nomeNatureza)) {
              const valorSaida = Number(transacao.saida) || 0;
  
              // Soma os valores de despesas com o mesmo nome_natureza
              custosAgrupados[nomeNatureza] = (custosAgrupados[nomeNatureza] || 0) + valorSaida;
            }
            
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // Converte o objeto agrupado para um array de objetos e emite o resultado
      const resultado = Object.keys(custosAgrupados).map(nomeNatureza => ({
        nomeNatureza,
        valor: parseFloat(custosAgrupados[nomeNatureza].toFixed(2)) // Formata para 2 casas decimais
      }));
  
      observer.next(resultado);
      observer.complete();
    });
  }


  obterLucroDetalhado(mes: number, ano: number): Observable<{ nomeNatureza: string, valor: number }[]> {
    return new Observable(observer => {
      // Validações iniciais (mantidas do original)
      if (!this.transacoes?.length) {
        observer.next([]);
        observer.complete();
        return;
      }
  
      if (mes < 1 || mes > 12 || isNaN(mes) || 
          ano < 2000 || ano > new Date().getFullYear() + 1 || isNaN(ano)) {
        observer.next([]);
        observer.complete();
        return;
      }
  
      const resultado: { [key: string]: { receita: number, despesa: number } } = {};
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || !transacao.nome_natureza) continue;

          const despesas = [
            // ===== DESPESAS ADMINISTRATIVAS (21102) =====
            "VIAGENS E ESTADIAS",
            "CONDUCAO E TRANSPORTE",
            "LANCHES E REFEICOES",
            "CONFRATERNIZACAO",
            "BENS DE PEQUENO VALOR",
            "CORREIOS E MALOTES",
            "FOTOCOPIAS E REPRODUCOES",
            "ASSINATURAS DE JORNAIS E REVIS",
            "EMOLUMENTOS CARTORIOS",
            "CERTIFICADO DIGITAL",
            "REEMBOLSOS",
            "OUTRAS DESPESAS",
          
            // ===== DESPESAS GERAIS (21103) =====
            "ALUGUEL DE IMOVEIS",
            "ALUGUEL DE VEICULOS",
            "ENERGIA ELETRICA",
            "AGUA E ESGOTO",
            "TELEFONIA FIXA",
            "TELEFONIA MOVEL",
            "INTERNET",
            "CONDOMINIO",
            "MATERIAL DE COPA E COZINHA",
            "MATERIAL DE EXPEDIENTE",
            "MATERIAL DE HIGIENE E LIMPEZA",
          
            // ===== DESPESAS COM PESSOAL (21104 - não alocadas a produção) =====
            "VALE REFEICAO ALIMENTACAO",
            "ASSISTENCIA MEDICA",
            "ASSISTENCIA ODONTOLOGICA",
            "SEGURO DE VIDA EM GRUPO",
            "AUXILIO CRECHE",
            "AUXILIO EDUCACAO",
            "PREVIDENCIA PRIVADA",
            "BOLSA DE ESTAGIARIOS",
            "VALE TRANSPORTE",
          
            // ===== DESPESAS COM DIRIGENTES (21105) =====
            "LUCRO DISTRIBUIDO - CARLOS HEN",
            "LUCRO DISTRIBUIDO - MATEUS MAC",
            "ADIANT. DE LUCRO - CARLOS HENR",
            "ADIANT. DE LUCRO - MATEUS MACI",
            "LUCRO DISTRIBUIDO - MANOEL VIR",
            "ADIANT. DE LUCRO - MANOEL VIRG",
          
            // ===== TRIBUTOS NÃO OPERACIONAIS (21107/21108/21109) =====
            "IPTU IMP PREDIAL TERRIT URBANO",
            "TAXAS DE BOMBEIRO",
            "ALVARA DE LOCALIZACAO",
          
            // ===== DESPESAS FINANCEIRAS (21201) =====
            "DESPESAS DE JUROS",
          
            // ===== DESPESAS NÃO OPERACIONAIS (299) =====
            "INDENIZACOES PAGAS",
    
            // ===== SERVIÇOS PRESTADOS (21101) =====
            "AUDITORIA",
            "CONSULTORIA",
            "ASSESSORIA JURIDICA",
            "ASSESSORIA CONTABIL",
            "SERVICOS INFORMATICA",
            "SERVICOS SEGURANCA",
            "SERVICOS LIMPEZA E CONSERVACAO",
            "SERVICOS SEGURANCA DO TRABALHO",
            "SERVICOS GRAFICOS",
            "SERVICOS DE ENTREGA",
            "FRETES E CARRETOS",
            "SERVICOS DE PUBLICIDADE E PROP",
            "SERVICO DE DIVULGACAO",
            "SERVICO FORNECIMENTO DE DADOS",
            "SERVICOS DEDETIZACAO",
          
            // ===== MÃO DE OBRA DIRETA (21104) =====
            "SALARIOS E ORDENADOS",
            "HORA EXTRA 50%",
            "HORA EXTRA 100%",
            "COMISSOES",
            "FARDAMENTO",
            "ALUGUEL DE IMOVEIS",
            "CONDOMINIO",
            "EXAMES MEDICOS", // (se vinculados à equipe operacional)
          
            // ===== MATERIAIS/REFORMAS (21106) =====
            "MATERIAL DE REFORMAS",
            "SERV DE REFORMAS",
            "MATERIAL DE MANUTENCAO",
            "SERV DE MANUTENCAO",
          
            // ===== TRIBUTOS SOBRE OPERAÇÕES (21107/21109) =====
            "ISS",
            "ISS RETIDO NA FONTE",
            "IRRF SERVICOS",
            "PIS",
            "COFINS",
            "IRPJ",
            "CSLL",
          
            // ===== DESPESAS COMERCIAIS (21111) =====
            "COMISSOES",
            "BRINDES E PRESENTES",
          
            // ===== MULTAS CONTRATUAIS (21110) =====
            "MULTAS COMPENSATORIAS POR ATRA",
            "MULTAS CONTRATUAIS PASSIVAS",
          
            // ===== LICENÇAS/SOFTWARES OPERACIONAIS (21103) =====
            "LICENCA DE USO",
            "HOSPEDAGEM DE DOMINIO",
            "SOFTWARES",
          
            // ===== PRO LABORE (21105 - se vinculado a atividades operacionais) =====
            "PRO LABORE"
          ];
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime()) || 
              data.getMonth() + 1 !== mes || 
              data.getFullYear() !== ano) continue;
  
          const nomeNatureza = transacao.nome_natureza;
          const entrada = Number(transacao.entrada) || 0;
          let saida = 0
          if (despesas.includes(nomeNatureza)) {
            saida = Number(transacao.saida) || 0;
          }
         
  
          // Inicializa se não existir
          if (!resultado[nomeNatureza]) {
            resultado[nomeNatureza] = { receita: 0, despesa: 0 };
          }
  
          // Acumula valores corretamente
          resultado[nomeNatureza].receita += entrada;
          resultado[nomeNatureza].despesa += saida;
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // Calcula o lucro (receita - despesa) para cada natureza
      const lucroDetalhado = Object.keys(resultado).map(nomeNatureza => ({
        nomeNatureza,
        valor: parseFloat((resultado[nomeNatureza].receita - resultado[nomeNatureza].despesa).toFixed(2))
      }));
  
      observer.next(lucroDetalhado);
      observer.complete();
    });
  }


  obterReceitaMensalDetalhada(mes: number, ano: number): Observable<{ nomeNatureza: string, valor: number }[]> {
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
  
      // Objeto para armazenar despesas agrupadas por nome_natureza
      const receitaAgrupada: { [key: string]: number } = {};
  
      for (const transacao of this.transacoes) {
        try {
          if (!transacao?.data || !transacao.entrada || !transacao.nome_natureza) continue;
  
          const data = new Date(transacao.data);
          if (isNaN(data.getTime())) continue;
  
          if (data.getMonth() + 1 === mes && data.getFullYear() === ano) {
            const nomeNatureza = transacao.nome_natureza;
            
            const valorSaida = Number(transacao.entrada) || 0;
  
            // Soma os valores de despesas com o mesmo nome_natureza
            receitaAgrupada[nomeNatureza] = (receitaAgrupada[nomeNatureza] || 0) + valorSaida;
          }
        } catch (error) {
          console.error('Erro ao processar transação:', error);
        }
      }
  
      // Converte o objeto agrupado para um array de objetos e emite o resultado
      const resultado = Object.keys(receitaAgrupada).map(nomeNatureza => ({
        nomeNatureza,
        valor: parseFloat(receitaAgrupada[nomeNatureza].toFixed(2)) // Formata para 2 casas decimais
      }));
  
      observer.next(resultado);
      observer.complete();
    });
  }

  formatarParaReal(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  
}


import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { FormGroup, FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../../layout/navbar/navbar.component";


@Component({
  selector: 'app-dashboard',
  imports: [ChartModule, DatePickerModule, FormsModule, CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  date: Date = new Date();
  receitaBrutaData: any;
  despesasData: any;
  lucroMensalData: any;
  custoMensalData: any;
  resumoUltimoMes: any;
  receitaBrutaMesSelecionado: any = 0;
  despensasMesSelecionado: any = 0;
  lucroMesSelecionado: any = 0;
  saldoMesSelecionado: any = 0;
  custosMesSelecionado: any = 0;
  primeiraDataDisponivel: Date | null = null;
  ultimaDataDisponivel: Date | null = null;
  custoContratosPorCliente: any;


  doughnutOptions = {
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    responsive: false,
    maintainAspectRatio: true,
    cutout: '60%', // Define o tamanho do "buraco" do donut
    aspectRatio: 2 
};

doughnutOptions2 = {
  plugins: {
      legend: {
          position: 'bottom'
      }
  },
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%', // Define o tamanho do "buraco" do donut
  aspectRatio: .8 
};

pieOptions = {
  plugins: {
      legend: {
          position: 'bottom'
      }
  },
  responsive: false,
  maintainAspectRatio: true,
  aspectRatio: 2 
};

  basicOptions = {
    indexAxis: 'y', // Gráfico horizontal
    responsive: true, // Tornar o gráfico responsivo
    maintainAspectRatio: true, // Desabilitar a manutenção da proporção
    plugins: {
      legend: {
        labels: {
          color: '#495057'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#262626'
        }
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#262626'
        }
      }
    }
  };

  verticalBarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: 'top', // Coloca a legenda no topo
            labels: {
                font: {
                    size: 12
                }
            }
        },
    }
  };


  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.carregarArquivoPadrao().then((response: any) => {
      const periodo = this.dashboardService.retornarPeriodoDatas();
      if (periodo && periodo.ultimaData && periodo.primeiraData) {
        this.ultimaDataDisponivel = periodo.ultimaData;
        this.primeiraDataDisponivel = periodo.primeiraData;
        this.date = periodo.ultimaData;
      }
      
      this.carregarDados();
    });
  }
  

  carregarDados() {
    const anoSelecionado = this.date.getFullYear();
    const mesSelecionado = this.date.getMonth() + 1;

    this.dashboardService.calcularReceitaMensal(mesSelecionado, anoSelecionado).subscribe((resultado: number | string) => {
      if (resultado) {
        this.receitaBrutaMesSelecionado = resultado;
      } else {
        console.warn('Nenhum dado retornado');
      }
    });

    this.dashboardService.calcularDespesasMensal(mesSelecionado, anoSelecionado).subscribe((resultado: number | string) => {
      if (resultado) {
        this.despensasMesSelecionado = resultado;
      } else {
        console.warn('Nenhum dado retornado');
      }
    });

    this.dashboardService.calcularCustoMensal(mesSelecionado, anoSelecionado).subscribe((resultado: number | string) => {
      if (resultado) {
        this.custosMesSelecionado = resultado;
      } else {
        console.warn('Nenhum dado retornado');
      }
    });

    this.dashboardService.calcularLucroMensal(mesSelecionado, anoSelecionado).subscribe((resultado: number | string) => {
      if (resultado) {
        this.lucroMesSelecionado = resultado;
      } else {
        console.warn('Nenhum dado retornado');
      }
    });

    this.dashboardService.calcularSaldoMensal(mesSelecionado, anoSelecionado).subscribe((resultado: string | number) =>{
      if (resultado) {
        this.saldoMesSelecionado = resultado;
      }
    })

    this.dashboardService.calcularCustoPorCliente(mesSelecionado, anoSelecionado).subscribe((resultado: any) =>{
      if (resultado) {
        this.mapearCustosPorContratoComCliente(resultado);
      }
    })

    this.dashboardService.obterDespesasDetalhadas(mesSelecionado, anoSelecionado).subscribe((resultado: any) =>{
      if (resultado) {
        this.mapearDespesasNoMes(resultado);
      }
    })

    this.dashboardService.obterCustosDetalhadas(mesSelecionado, anoSelecionado).subscribe((resultado: any) =>{
      if (resultado) {
        this.mapearCustosNoMes(resultado);
      }
    })

    this.dashboardService.obterLucroDetalhado(mesSelecionado, anoSelecionado).subscribe((resultado: any) =>{
      if (resultado) {
        this.mapearLucroNoMes(resultado);
      }
    })

    this.dashboardService.obterReceitaMensalDetalhada(mesSelecionado, anoSelecionado).subscribe((resultado: any) =>{
      if (resultado) {
        this.mapearReceitaNoMes(resultado);
      }
    })
  }

  mapearCustosPorContratoComCliente(dados: any) {
    this.custoContratosPorCliente = {
      labels: dados.map((item: any) => item.cliente), // Nomes dos clientes
      datasets: [
        {
          label: 'Custo por Cliente',
          data: dados.map((item: any) => item.custo), // Valores de custo
          backgroundColor: [
            "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A", 
            "#FF7043", "#EC407A", "#7E57C2", "#D4E157", "#FFCA28"
          ]
        }
      ]
    };
  }

  mapearDespesasNoMes(dados: any) {
    this.despesasData = {
      labels: dados.map((item: any) => item.nomeNatureza), // Nomes dos clientes
      datasets: [
        {
          label: 'Despesas',
          data: dados.map((item: any) => item.valor), // Valores de custo
          backgroundColor: [
            "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A", 
            "#FF7043", "#EC407A", "#7E57C2", "#D4E157", "#FFCA28"
          ]
        }
      ]
    };
  }

  mapearCustosNoMes(dados: any) {
    this.custoMensalData = {
      labels: dados.map((item: any) => item.nomeNatureza), // Nomes dos clientes
      datasets: [
        {
          label: 'Custos',
          data: dados.map((item: any) => item.valor), // Valores de custo
          backgroundColor: [
            "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A", 
            "#FF7043", "#EC407A", "#7E57C2", "#D4E157", "#FFCA28"
          ]
        }
      ]
    };
  }

  mapearLucroNoMes(dados: any) {
    this.lucroMensalData = {
      labels: dados.map((item: any) => item.nomeNatureza), // Nomes dos clientes
      datasets: [
        {
          label: "Lucro e Prejuizo",
          data: dados.map((item: any) => item.valor), // Valores de custo
          backgroundColor: [
            "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A", 
            "#FF7043", "#EC407A", "#7E57C2", "#D4E157", "#FFCA28"
          ]
          
        }
      ]
    };
  }

  mapearReceitaNoMes(dados: any) {
    this.receitaBrutaData = {
      labels: dados.map((item: any) => item.nomeNatureza), // Nomes dos clientes
      datasets: [
        {
          label: 'Receitas',
          data: dados.map((item: any) => item.valor), // Valores de custo
          backgroundColor: [
            "#42A5F5", "#66BB6A", "#FFA726", "#AB47BC", "#26A69A", 
            "#FF7043", "#EC407A", "#7E57C2", "#D4E157", "#FFCA28"
          ]
        }
      ]
    };
  }

  carregarArquivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.dashboardService.carregarDadosArquivo(file).then(() => {
        this.carregarDados();
      });
    }
  }

  onDateChange(newDate: Date) {
    this.carregarDados();
  }

}


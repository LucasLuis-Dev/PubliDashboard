
import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { FormGroup, FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';


@Component({
  selector: 'app-dashboard',
  imports: [ChartModule, DatePickerModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  date: Date = new Date();
  receitaBrutaData: any;
  despesasData: any;
  custoContratosData: any;
  lucroMensalData: any;
  resumoUltimoMes: any;

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.carregarArquivoPadrao().then((response: any) => {
      this.carregarDados();
    });
  }
  

  carregarDados() {
    const anoAtual = this.date.getFullYear();
    const mesAtual = this.date.getMonth() + 1;
    
    this.receitaBrutaData = {
      labels: Array.from({ length: 12 }, (_, i) => `Mês ${i + 1}`),
      datasets: [
        {
          label: 'Receita Bruta (R$)',
          backgroundColor: '#42A5F5',
          data: this.dashboardService.getReceitaBrutaGrafico(anoAtual).map(d => d.value)
        }
      ]
    };

    this.despesasData = {
      labels: this.dashboardService.getDespesasGrafico(mesAtual, anoAtual).map(d => d.name),
      datasets: [
        {
          label: 'Despesas (R$)',
          backgroundColor: '#FF6384',
          data: this.dashboardService.getDespesasGrafico(mesAtual, anoAtual).map(d => d.value)
        }
      ]
    };

    this.custoContratosData = {
      labels: this.dashboardService.getCustoContratosGrafico(mesAtual, anoAtual).map(d => d.name),
      datasets: [
        {
          label: 'Custo por Contrato (R$)',
          backgroundColor: '#FFCE56',
          data: this.dashboardService.getCustoContratosGrafico(mesAtual, anoAtual).map(d => d.value)
        }
      ]
    };

    this.lucroMensalData = {
      labels: [`Lucro ${mesAtual}/${anoAtual}`],
      datasets: [
        {
          label: 'Lucro Mensal (R$)',
          backgroundColor: '#66BB6A',
          data: [this.dashboardService.getLucroMensalGrafico(mesAtual, anoAtual).value]
        }
      ]
    };

    this.resumoUltimoMes = this.dashboardService.getResumoUltimoMes();
  }

  carregarArquivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.dashboardService.carregarDadosArquivo(file).then(() => {
        this.carregarDados();
      });
    }
  }

  basicData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Vendas',
        backgroundColor: '#42A5F5',
        data: [65, 59, 80, 81, 56]
      },
      {
        label: 'Despesas',
        backgroundColor: '#FFA726',
        data: [35, 40, 60, 47, 88]
      }
    ]
  };
  basicOptions = {
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
          color: '#ebedef'
        }
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      }
    }
  };

  basicData2 = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Custo por Contrato (R$)',
        backgroundColor: '#FF6384',
        data: [15000, 18000, 17000, 20000, 22000, 21000, 19500, 20500, 23000, 25000, 24000, 26000]
      }
    ]
  };

  basicOptions2 = {
    indexAxis: 'y', // Define o eixo Y como indexador (barras horizontais)
    responsive: true,
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
          color: '#ebedef'
        }
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      }
    }
  };
}


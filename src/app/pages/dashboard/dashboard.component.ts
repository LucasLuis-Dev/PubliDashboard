
import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { FormGroup, FormsModule } from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  imports: [ChartModule, DatePickerModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  date: Date = new Date();

  formGroup!: FormGroup;

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


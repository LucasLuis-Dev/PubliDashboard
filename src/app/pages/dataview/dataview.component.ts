import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DashboardService } from '../../services/dashboard.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NavbarComponent } from '../../layout/navbar/navbar.component';


@Component({
  selector: 'app-dataview',
  imports: [TableModule, CommonModule, NavbarComponent],
  templateUrl: './dataview.component.html',
  styleUrl: './dataview.component.scss',
  providers: [DatePipe]
})
export class DataviewComponent implements OnInit {

  transacoes: any = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
      this.dashboardService.carregarArquivoPadrao().then((response: any) => {
        this.transacoes = this.dashboardService.obterTransacoes()
      } );  
  }

  getColunas(): string[] {
    return this.transacoes.length ? Object.keys(this.transacoes[0]) : [];
  }
  
}

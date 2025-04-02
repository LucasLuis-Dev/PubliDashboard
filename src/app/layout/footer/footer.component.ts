import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  isDashboardRoute: boolean = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const urlAtual = this.router.url;
      this.isDashboardRoute = urlAtual === '/dashboard' || urlAtual === '/dataview';
    });
  }
}

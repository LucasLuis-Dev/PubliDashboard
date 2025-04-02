import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TooltipModule } from 'primeng/tooltip';


@Component({
  selector: 'app-navbar',
  imports: [AvatarModule, AvatarGroupModule, TooltipModule, RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isDashboardRoute: boolean = false;
  isDataViewRoute: boolean = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const urlAtual = this.router.url;
      this.isDashboardRoute = urlAtual === '/dashboard';
      this.isDataViewRoute = urlAtual === '/dataview';
    });
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, DatePickerModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'publidashboard';
}

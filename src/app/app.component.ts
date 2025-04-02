import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { FooterComponent } from "./layout/footer/footer.component";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, DatePickerModule, FooterComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'publidashboard';
}

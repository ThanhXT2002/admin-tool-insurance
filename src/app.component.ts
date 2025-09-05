import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Toast, ToastModule  } from "primeng/toast";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, Toast, ToastModule],
    template: `<router-outlet></router-outlet> <p-toast></p-toast>`
})
export class AppComponent {}

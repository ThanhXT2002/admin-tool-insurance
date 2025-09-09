import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Toast, ToastModule } from 'primeng/toast';
import { LoadingService } from '@/layout/service/loading.service';
import { AppLoading } from '@/layout/component/app.loading';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, Toast, ToastModule, AppLoading, CommonModule],
    template: `
        @if (loadingService.loading()) {
            <app-loading />
        } @else {
            <router-outlet></router-outlet>
        }
        <p-toast></p-toast>
    `
})
export class AppComponent {
    loadingService = inject(LoadingService);
}

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
        <router-outlet></router-outlet>

        <!-- Global loading overlay: keep router content mounted and show overlay on top -->
        @if (loadingService.loading()) {
            <app-loading class="global-loading-overlay !fixed top-0 left-0 right-0  !h-screen !w-full z-[9999]" />
        }

        <p-toast></p-toast>
    `
})
export class AppComponent {
    loadingService = inject(LoadingService);
}

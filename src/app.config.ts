import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { AuthStore } from './app/core/auth/auth.store';
import { AuthService } from './app/pages/service/auth.service';
import { MessageService } from 'primeng/api';
import { authInterceptor } from '@/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,
        provideAppInitializer(async () => {
            const authStore = inject(AuthStore);
            const authService = inject(AuthService);
            try {
                const token = await authService.getAccessToken();
                if (token) {
                    // try loadProfile with a simple retry (2 attempts)
                    let attempts = 0;
                    const maxAttempts = 2;
                    while (attempts < maxAttempts) {
                        attempts++;
                        try {
                            await authStore.loadProfile();
                            break;
                        } catch (err) {
                            console.warn(`auth initializer loadProfile attempt ${attempts} failed`, err);
                            if (attempts >= maxAttempts) {
                                console.error('auth initializer failed to load profile');
                            } else {
                                // small backoff
                                await new Promise((r) => setTimeout(r, 300));
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('auth initializer error', e);
            }
        })
    ]
};

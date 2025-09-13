import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/pages/service/auth.service';
import { AuthStore } from '../store/auth/auth.store';

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const authStore = inject(AuthStore);

    // Prefer store (sync) to avoid extra I/O
    const profile = authStore.profile();
    if (profile) return true;

    // Fallback to Supabase user check (preserve existing behavior and refresh token)
    const user = await authService.getUser();
    if (user) {
        // trigger forced refresh of profile in background to ensure store is populated
        authStore.loadProfile(true).catch(() => {});
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};

export const loginGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const authStore = inject(AuthStore);

    const profile = authStore.profile();
    if (profile) {
        router.navigate(['/']);
        return false;
    }

    const user = await authService.getUser();
    if (user) {
        router.navigate(['/']);
        // load profile in background
        authStore.loadProfile().catch(() => {});
        return false;
    }
    return true;
};

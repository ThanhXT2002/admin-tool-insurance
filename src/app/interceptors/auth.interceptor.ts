import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { of, throwError } from 'rxjs';
import { AuthService } from '@/pages/service/auth.service';
import { AuthStore } from '@/store/auth/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const authStore = inject(AuthStore);
    const router = inject(Router);

    return from(authService.getAccessToken()).pipe(
        switchMap((accessToken) => {
            const authReq = accessToken ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;
            return next(authReq).pipe(
                catchError((err: any) => {
                    if (err?.status === 401) {
                        try {
                            authStore.clear();
                        } catch (e) {}
                        // avoid navigating if already on login page
                        if (router.url !== '/auth/login') {
                            router.navigate(['/auth/login']);
                        }
                    }
                    return throwError(() => err);
                })
            );
        })
    );
};

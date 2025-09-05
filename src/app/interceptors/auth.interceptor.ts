import { AuthService } from '@/pages/service/api/auth.service';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';


import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return from(authService.getAccessToken()).pipe(
    switchMap(accessToken => {
      if (accessToken) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};


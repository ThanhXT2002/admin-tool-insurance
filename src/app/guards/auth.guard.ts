

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/pages/service/api/auth.service';


export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = await authService.getUser();
  if (user) {
    return true;
  } else {
    router.navigate(['/auth/login']);
    return false;
  }
};

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = await authService.getUser();
  if (user) {
    router.navigate(['/']);
    return false;
  }
  return true;
};


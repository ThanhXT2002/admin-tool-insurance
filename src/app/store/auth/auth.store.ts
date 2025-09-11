import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { AuthApiService } from './auth.api';
import { UserProfileSafe, PROFILE_TTL_MS } from './auth.types';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '@/pages/service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
    private api = inject(AuthApiService);
    private injector = inject(Injector);

    profile = signal<UserProfileSafe | null>(null);
    status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    error = signal<string | null>(null);
    private lastFetchedAt = 0;
    private pendingPromise: Promise<UserProfileSafe | null> | null = null;

    isAdmin = computed(() => !!this.profile()?.roles?.includes('admin'));

    async loadProfile(force = false): Promise<UserProfileSafe | null> {
        const authService = this.injector.get(AuthService);
        const messageService = this.injector.get(MessageService);
        const router = this.injector.get(Router);
        if (!force && this.status() === 'loaded' && this.profile()) return this.profile();

        const now = Date.now();
        if (!force && this.lastFetchedAt && now - this.lastFetchedAt < PROFILE_TTL_MS && this.profile()) {
            return this.profile();
        }

        if (this.pendingPromise) return this.pendingPromise;

        this.status.set('loading');
        this.error.set(null);

        this.pendingPromise = this.api
            .getProfile()
            .then((p) => {
                this.profile.set(p);
                this.status.set('loaded');
                this.lastFetchedAt = Date.now();
                return p;
            })
            .catch((err: any) => {
                // Nếu server trả 401/403 => token không hợp lệ hoặc tài khoản bị khoá
                const status = err?.status ?? err?.statusCode ?? err?.response?.status;
                if (status === 401 || status === 403) {
                    try {
                        const msg = status === 403 ? 'Tài khoản của bạn đã bị khóa hoặc đang gặp vấn đề nghiêm trọng' : 'Phiên đăng nhập hết hạn. Đăng xuất...';
                        messageService.add({ severity: 'error', summary: msg });
                    } catch {
                        /* ignore if messageService unavailable */
                    }
                    // sign out, clear store và điều hướng
                    authService.signOut().finally(() => {
                        this.clear();
                        router.navigate(['/auth/login']);
                    });

                    return null;
                }

                // Các lỗi khác: set error trạng thái
                this.error.set(err?.message || String(err));
                this.status.set('error');
                return null;
            })
            .finally(() => {
                this.pendingPromise = null;
            });

        return this.pendingPromise;
    }

    setProfile(p: UserProfileSafe | null) {
        this.profile.set(p);
        this.status.set(p ? 'loaded' : 'idle');
        this.lastFetchedAt = p ? Date.now() : 0;
    }

    clear() {
        this.profile.set(null);
        this.status.set('idle');
        this.error.set(null);
        this.lastFetchedAt = 0;
        this.pendingPromise = null;
    }
}

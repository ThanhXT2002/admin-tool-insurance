import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthApiService } from './auth.api';
import { UserProfileSafe, PROFILE_TTL_MS } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthStore {
    private api = inject(AuthApiService);

    profile = signal<UserProfileSafe | null>(null);
    status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    error = signal<string | null>(null);
    private lastFetchedAt = 0;
    private pendingPromise: Promise<UserProfileSafe | null> | null = null;

    isAdmin = computed(() => !!this.profile()?.roles?.includes('admin'));

    async loadProfile(force = false): Promise<UserProfileSafe | null> {
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

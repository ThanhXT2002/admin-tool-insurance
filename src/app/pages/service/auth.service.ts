import { inject, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, AuthChangeEvent, Session, User } from '@supabase/supabase-js';

// import { createUser } from '../interfaces/user.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MessageService } from 'primeng/api';
import { AuthStore } from '../../store/auth/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private supabase: SupabaseClient;
    readonly user = signal<User | null>(null);
    private http = inject(HttpClient);
    apiUrl = environment.apiUrl + '/users';
    private router = inject(Router);
    private messageService = inject(MessageService);
    private authStore = inject(AuthStore);

    constructor() {
        this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        });
        // Lắng nghe trạng thái đăng nhập
        this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            this.user.set(session?.user ?? null);
        });
        // NOTE: avoid calling getUser() here to prevent duplicate network requests on app reload.
        // onAuthStateChange will handle updating `user` when Supabase initializes the session.
        // console.log('access_token:', this.getAccessToken());
    }

    // Đăng ký tài khoản mới
    async signUp(email: string, password: string) {
        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin + '/verify-email'
            }
        });
    }

    // Đăng nhập bằng email/password
    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    // Đăng xuất
    async logout() {
        try {
            await this.signOut();
            this.messageService.add({ severity: 'success', summary: 'Đăng xuất thành công!' });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Đăng xuất thất bại!' });
        }
    }

    async signOut() {
        await this.supabase.auth.signOut();
        this.user.set(null);
        // clear client-side auth store so guards and UI reflect logged-out state immediately
        try {
            this.authStore.clear();
        } catch (e) {}
        // await navigation so caller sees the route change before continuing
        await this.router.navigate(['/auth/login']);
    }

    // Gửi email quên mật khẩu
    async resetPassword(email: string) {
        return this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        });
    }

    // Cập nhật mật khẩu mới cho user (dùng cho reset password)
    async updateUserPassword(newPassword: string) {
        return this.supabase.auth.updateUser({ password: newPassword });
    }

    // Lấy user hiện tại
    getCurrentUser() {
        return this.user();
    }

    // Lấy thông tin user thực tế từ Supabase (dùng cho guard)
    private pendingGetUser: Promise<User | null> | null = null;

    // Dedupe concurrent getUser calls so multiple callers on reload don't trigger multiple requests
    async getUser() {
        if (this.pendingGetUser) return this.pendingGetUser;
        this.pendingGetUser = (async () => {
            try {
                const { data } = await this.supabase.auth.getUser();
                return data.user ?? null;
            } finally {
                // clear pending promise so subsequent calls can re-fetch when needed
                this.pendingGetUser = null;
            }
        })();
        return this.pendingGetUser;
    }

    // Lắng nghe thay đổi trạng thái đăng nhập
    authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
        return this.supabase.auth.onAuthStateChange(callback);
    }

    //   createUser(userData: createUser): Observable<unknown> {
    //     return this.http.post(`${this.apiUrl}/register`, userData);
    //   }

    async getAccessToken(): Promise<string | null> {
        const { data } = await this.supabase.auth.getSession();
        // console.log('Current session:', data.session?.access_token);
        return data.session?.access_token ?? null;
    }
}

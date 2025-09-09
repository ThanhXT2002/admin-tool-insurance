import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserProfileSafe } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private http = inject(HttpClient);
    private base = environment.apiUrl;

    async getProfile(): Promise<UserProfileSafe> {
        const res = await firstValueFrom(this.http.get<{ data: UserProfileSafe }>(`${this.base}/auth/profile`));
        return (res && (res as any).data) || (null as any);
    }
}

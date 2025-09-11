import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserProfileSafe } from './auth.types';
import { ApiResponse } from '@/interfaces/api-response.interface';
import { updateProfile } from '@/interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/auth';

    async getProfile(): Promise<UserProfileSafe> {
        const res = await firstValueFrom(this.http.get<{ data: UserProfileSafe }>(`${this.base}/profile`));
        return (res && (res as any).data) || (null as any);
    }

    updateProfile(data: updateProfile): Observable<ApiResponse<UserProfileSafe>> {
        return this.http.put<ApiResponse<UserProfileSafe>>(`${this.base}/profile`, data);
    }

    updateAvatar(file: File): Observable<ApiResponse<UserProfileSafe>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<{ user: UserProfileSafe; uploadInfo?: any }>>(`${this.base}/avatar`, formData).pipe(
            map((res) => {
                // Backend returns data.user and data.uploadInfo — normalize to ApiResponse<UserProfileSafe>
                const user = (res.data as any)?.user as UserProfileSafe | undefined;
                return {
                    ...res,
                    data: user as any
                } as ApiResponse<UserProfileSafe>;
            })
        );
    }
}

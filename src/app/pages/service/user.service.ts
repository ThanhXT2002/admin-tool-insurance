import { ApiResponse } from '@/interfaces/api-response.interface';
import { PaginationQuery } from '@/interfaces/paginate-query.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface User {
    id: number;
    supabaseId: string;
    email: string;
    name?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    addresses?: string | null;
    active?: boolean;
    roleKeys?: string[];
    permissionKeys?: string[];
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface UserCreateDto {
    email: string;
    password: string;
    phoneNumber?: string | null;
    addresses?: string;
    roleKeys?: string[];
    permissionKeys?: string[];
    avatar?: File | null;
}

export interface UserUpdateDto {
    id: number;
    name?: string;
    phoneNumber?: string | null;
    addresses?: string;
    roleKeys?: string[];
    permissionKeys?: string[];
    avatar?: File | null;
    active?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/users';

    getAll(query?: PaginationQuery): Observable<ApiResponse<{ rows: User[]; total: number }>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        if (query?.active !== undefined && query?.active !== null) {
            params.active = String(query.active);
        }
        return this.http.get<ApiResponse<{ rows: User[]; total: number }>>(`${this.base}`, { params });
    }

    getById(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.base}/${id}`);
    }

    // Chấp nhận FormData (nếu upload avatar) hoặc DTO thường
    create(data: UserCreateDto | FormData): Observable<ApiResponse<User>> {
        if (data instanceof FormData) {
            return this.http.post<ApiResponse<User>>(`${this.base}`, data as any);
        }
        const fd = this.buildFormData(data);
        return this.http.post<ApiResponse<User>>(`${this.base}`, fd as any);
    }

    // Đối với update: lúc gọi sẽ gửi FormData (nếu caller chuyển DTO thì tự động chuyển)
    update(id: number, data: UserUpdateDto | FormData): Observable<ApiResponse<User>> {
        if (data instanceof FormData) {
            return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, data as any);
        }
        const fd = this.buildFormData(data as any);
        return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, fd as any);
    }

    delete(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    deleteMultiple(ids: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/delete-multiple`, { ids });
    }

    activeMultiple(ids: number[], active: boolean): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/active-multiple`, { ids, active });
    }

    // Hàm hỗ trợ: chuyển DTO -> FormData. Nếu có `avatar` là File thì sẽ append
    private buildFormData(payload: any): FormData {
        const fd = new FormData();
        for (const key of Object.keys(payload)) {
            const val = payload[key];
            if (val === undefined || val === null) continue;
            // bỏ qua trường id chỉ dùng cho client khi tạo (id dùng trong URL cho update)
            if (key === 'id') continue;
            if (key === 'avatar') {
                if (val instanceof File) fd.append('avatar', val, val.name);
                continue;
            }
            if (Array.isArray(val)) {
                // thêm mảng dưới dạng chuỗi JSON; backend sẽ parse JSON nếu nhận được
                fd.append(key, JSON.stringify(val));
            } else if (typeof val === 'boolean') {
                fd.append(key, String(val));
            } else {
                fd.append(key, String(val));
            }
        }
        return fd;
    }
}

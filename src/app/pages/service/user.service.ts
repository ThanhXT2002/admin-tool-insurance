import { ApiResponse } from '@/interfaces/api-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Permission {
    id: number;
    key: string;
    name: string;
    description?: string | null;
    allowed?: boolean;
}

export interface Role {
    id: number;
    key: string;
    name: string;
    description?: string | null;
    permissions?: Permission[];
}

export interface RoleAssignment {
    id?: number;
    role: Role;
}

export interface User {
    id: number;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    addresses?: string | null;
    active?: boolean;
    roleKeys?: string[];
    roles?: Role[];
    roleAssignments?: RoleAssignment[];
    directPermissions?: Permission[];
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface UserCreateDto {
    email: string;
    password: string;
    name?: string;
    addresses?: string;
    roleKeys?: string[];
    active?: boolean;
    // For file upload use FormData instead of this DTO
}

export interface UserUpdateDto {
    id: number;
    name?: string;
    addresses?: string;
    roleKeys?: string[];
    active?: boolean;
    // For file upload use FormData instead of this DTO
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    keyword?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/users';

    getAll(query?: PaginationQuery): Observable<ApiResponse<User[]>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        return this.http.get<ApiResponse<User[]>>(`${this.base}`, { params });
    }

    getById(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.base}/${id}`);
    }

    getFullDetails(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.base}/${id}/full-details`);
    }

    // Accept either FormData (for avatar upload) or plain DTO
    create(data: UserCreateDto | FormData): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.base}`, data as any);
    }

    // For updates with avatar use FormData, otherwise send JSON DTO
    update(data: UserUpdateDto | FormData): Observable<ApiResponse<User>> {
        const id = (data as UserUpdateDto).id;
        return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, data as any);
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

    // Alias to match backend alias route
    getUserByIdAlias(id: number): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.base}/getUserById/${id}`);
    }

    // Return roles assigned to user (if such route exists /users/:id/roles or similar)
    getUserWithRoles(id: number): Observable<ApiResponse<Role[] | User[]>> {
        // Backend provides routes to get user with roles in different shapes; try full-details first
        return this.http.get<ApiResponse<Role[] | User[]>>(`${this.base}/${id}/full-details`);
    }
}

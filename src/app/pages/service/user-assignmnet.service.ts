import { ApiResponse } from '@/interfaces/api-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Role {
    id: number;
    key: string;
    name: string;
    description?: string | null;
}

export interface UserSummary {
    id: number;
    email: string;
    name?: string | null;
    roleAssignments?: { role: Role }[];
}

@Injectable({
    providedIn: 'root'
})
export class UserAssignmnetService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/user-assignments';

    // GET /api/user-assignments
    getAll(query?: { page?: number; limit?: number; keyword?: string }): Observable<ApiResponse<{ users: UserSummary[]; total: number; page: number; limit: number; totalPages: number }>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;

        return this.http.get<ApiResponse<{ users: UserSummary[]; total: number; page: number; limit: number; totalPages: number }>>(`${this.base}`, { params });
    }

    // GET /api/user-assignments/:id
    getById(id: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.base}/${id}`);
    }

    // GET /api/user-assignments/:userId/roles
    getUserRoles(userId: number): Observable<ApiResponse<Role[]>> {
        return this.http.get<ApiResponse<Role[]>>(`${this.base}/${userId}/roles`);
    }

    // POST /api/user-assignments/:userId/roles
    assignRole(userId: number, roleId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/${userId}/roles`, { roleId });
    }

    // DELETE /api/user-assignments/:userId/roles/:roleId
    removeRole(userId: number, roleId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${userId}/roles/${roleId}`);
    }

    // GET /api/user-assignments/:userId/permissions
    listDirectPermissions(userId: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/${userId}/permissions`);
    }

    // POST /api/user-assignments/:userId/permissions
    assignPermission(userId: number, permissionId: number): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/${userId}/permissions`, { permissionId });
    }

    // DELETE /api/user-assignments/:userId/permissions/:permissionId
    removePermission(userId: number, permissionId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${userId}/permissions/${permissionId}`);
    }

    // GET /api/user-assignments/:userId/effective-permissions
    listEffectivePermissions(userId: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/${userId}/effective-permissions`);
    }

    // GET /api/user-assignments/:userId/has-permission/:permissionKey
    hasPermission(userId: number, permissionKey: string): Observable<ApiResponse<{ hasPermission: boolean }>> {
        return this.http.get<ApiResponse<{ hasPermission: boolean }>>(`${this.base}/${userId}/has-permission/${encodeURIComponent(permissionKey)}`);
    }

    // POST /api/user-assignments/search
    searchUsers(body: { keyword?: string; roleIds?: number[]; permissionIds?: number[]; page?: number; limit?: number }): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/search`, body);
    }
}

import { ApiResponse } from '@/interfaces/api-response.interface';
import { PaginationQuery } from '@/interfaces/paginate-query.interface';
import { Permission } from '@/interfaces/permission.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface userRole {
    id: number;
    key: string;
    name: string;
    description?: string;
    permissions?: Permission[];
    permissionIds?: number[];
}

@Injectable({
    providedIn: 'root'
})
export class UserRoleService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/user-roles';

    isEditMode = signal(false);

    dataEditItem = signal<userRole | null>(null);

    isShowForm = signal(false);

    // Query params: page, limit, keyword
    getAll(query?: PaginationQuery): Observable<ApiResponse<{ rows: userRole[]; total: number }>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;

        return this.http.get<ApiResponse<{ rows: userRole[]; total: number }>>(`${this.base}`, { params });
    }

    private toPayload(data: userRole) {
        const payload: any = {
            key: data.key,
            name: data.name,
            description: data.description
        };

        if (Array.isArray(data.permissionIds)) {
            payload.permissionIds = data.permissionIds;
        } else if (Array.isArray(data.permissions)) {
            payload.permissionIds = data.permissions.map((p) => p.id);
        }

        return payload;
    }

    createRole(data: userRole): Observable<ApiResponse<userRole>> {
        const payload = this.toPayload(data);
        return this.http.post<ApiResponse<userRole>>(`${this.base}`, payload);
    }

    updateRole(id: number, data: userRole): Observable<ApiResponse<userRole>> {
        const payload = this.toPayload(data);
        return this.http.put<ApiResponse<userRole>>(`${this.base}/${id}`, payload);
    }

    getRoleIdWithPermissions(id: number): Observable<ApiResponse<userRole>> {
        return this.http.get<ApiResponse<userRole>>(`${this.base}/${id}`);
    }

    deleteRole(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    getRolePermissions(id: number): Observable<ApiResponse<Permission[]>> {
        return this.http.get<ApiResponse<Permission[]>>(`${this.base}/${id}/permissions`);
    }

    assignPermissionsToRole(id: number, permissionIds: number[]): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/${id}/permissions`, { permissionIds });
    }

    removePermissionFromRole(id: number, permissionId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${id}/permissions/${permissionId}`);
    }

    getUserWithRoles(id: number): Observable<ApiResponse<userRole[]>> {
        return this.http.get<ApiResponse<userRole[]>>(`${this.base}/${id}/users`);
    }
}

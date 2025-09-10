import { ApiResponse } from '@/interfaces/api-response.interface';
import { Permission } from '@/interfaces/permission.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';



@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/permissions';

    // GET /api/permissions
    getAll(query?: { page?: number; limit?: number; keyword?: string }): Observable<ApiResponse<{ rows: Permission[]; total: number }>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;

        return this.http.get<ApiResponse<{ rows: Permission[]; total: number }>>(`${this.base}`, { params });
    }

    // GET /api/permissions/:id
    getById(id: number): Observable<ApiResponse<Permission>> {
        return this.http.get<ApiResponse<Permission>>(`${this.base}/${id}`);
    }

    // POST /api/permissions
    create(data: { key: string; name: string; description?: string }): Observable<ApiResponse<Permission>> {
        return this.http.post<ApiResponse<Permission>>(`${this.base}`, data);
    }

    // PUT /api/permissions/:id
    update(id: number, data: { key?: string; name?: string; description?: string }): Observable<ApiResponse<Permission>> {
        return this.http.put<ApiResponse<Permission>>(`${this.base}/${id}`, data);
    }

    // DELETE /api/permissions/:id
    delete(id: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    // GET /api/permissions/:id/users
    getUsersWithPermission(id: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/${id}/users`);
    }

    // GET /api/permissions/check?userId=...&permission=...
    checkPermission(userId: number, permissionKey: string): Observable<ApiResponse<{ hasPermission: boolean }>> {
        const params = { userId: userId.toString(), permission: permissionKey };
        return this.http.get<ApiResponse<{ hasPermission: boolean }>>(`${this.base}/check`, { params });
    }
}

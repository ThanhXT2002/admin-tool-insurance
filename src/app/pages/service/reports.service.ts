import { ApiResponse } from '@/interfaces/api-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PermissionsSummary {
    totalPermissions: number;
    totalRoles: number;
    totalUsers: number;
    rolePermissionCount: number;
    userPermissionCount: number;
    userRoleAssignments: number;
    averagePermissionsPerRole: number;
    averageRolesPerUser: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/reports';

    getPermissionsSummary(): Observable<ApiResponse<PermissionsSummary>> {
        return this.http.get<ApiResponse<PermissionsSummary>>(`${this.base}/permissions-summary`);
    }

    getUsersByRole(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/users-by-role`);
    }

    getPermissionsByRole(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/permissions-by-role`);
    }

    getMostUsedPermissions(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/most-used-permissions`);
    }

    getUsersWithMultipleRoles(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/users-with-multiple-roles`);
    }

    getOrphanedPermissions(): Observable<ApiResponse<{ permissions: any[]; total: number; recommendations: string[] }>> {
        return this.http.get<ApiResponse<{ permissions: any[]; total: number; recommendations: string[] }>>(`${this.base}/orphaned-permissions`);
    }

    getRolePermissionMatrix(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.base}/role-permission-matrix`);
    }

    getUserAccessAudit(userId: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.base}/user-access-audit/${userId}`);
    }
}

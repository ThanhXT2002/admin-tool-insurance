import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ApiResponse } from '@/interfaces/api-response.interface';
import { PaginationQuery } from '@/interfaces/paginate-query.interface';
import {
    VehicleType,
    VehicleTypeCreateDto,
    VehicleTypeUpdateDto,
    VehicleTypeBatchRequest,
    UsageType,
    UsagePurpose
} from '@/interfaces/vehicle-type.interface';

/**
 * Service quản lý API calls cho VehicleType
 * Cung cấp các phương thức CRUD và các operations đặc biệt
 */
@Injectable({
    providedIn: 'root'
})
export class VehicleTypeService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/vehicle-types';

    /**
     * Lấy danh sách loại phương tiện (dành cho admin) có hỗ trợ phân trang, tìm kiếm và lọc
     * Tham số: page, limit, keyword, active, usageType, usagePurpose
     */
    getAll(
        query?: PaginationQuery & {
            active?: boolean;
            usageType?: UsageType;
            usagePurpose?: UsagePurpose;
        }
    ) {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        if (query?.active !== undefined && query?.active !== null)
            params.active = String(query.active);
        if (query?.usageType) params.usageType = query.usageType;
        if (query?.usagePurpose) params.usagePurpose = query.usagePurpose;

        return this.http.get<
            ApiResponse<{ rows: VehicleType[]; total: number }>
        >(`${this.base}`, { params });
    }

    /**
     * Lấy danh sách loại phương tiện theo loại sử dụng (public, chỉ active)
     * Dùng cho dropdown selection trong frontend
     */
    getByUsageType(usageType: UsageType) {
        return this.http.get<ApiResponse<VehicleType[]>>(
            `${this.base}/usage-type/${usageType}`
        );
    }

    /**
     * Lấy danh sách loại phương tiện theo mục đích sử dụng (public, chỉ active)
     * Dùng cho dropdown selection trong frontend
     */
    getByUsagePurpose(usagePurpose: UsagePurpose) {
        return this.http.get<ApiResponse<VehicleType[]>>(
            `${this.base}/usage-purpose/${usagePurpose}`
        );
    }

    /**
     * Lấy loại phương tiện theo mã code (public)
     */
    getByCode(code: string) {
        return this.http.get<ApiResponse<VehicleType>>(
            `${this.base}/code/${code}`
        );
    }

    /**
     * Lấy thống kê loại phương tiện (public)
     */
    getStatistics() {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/statistics`);
    }

    /**
     * Lấy chi tiết loại phương tiện theo ID (public)
     */
    getById(id: number) {
        return this.http.get<ApiResponse<VehicleType>>(`${this.base}/${id}`);
    }

    /**
     * Tạo mới loại phương tiện (admin)
     * Yêu cầu authentication và permission vehicle_type.create
     */
    create(data: VehicleTypeCreateDto) {
        return this.http.post<ApiResponse<VehicleType>>(`${this.base}`, data);
    }

    /**
     * Cập nhật loại phương tiện theo ID (admin)
     * Yêu cầu authentication và permission vehicle_type.update
     */
    update(id: number, data: VehicleTypeUpdateDto) {
        return this.http.put<ApiResponse<VehicleType>>(
            `${this.base}/${id}`,
            data
        );
    }

    /**
     * Vô hiệu hóa loại phương tiện (soft delete) (admin)
     * Yêu cầu authentication và permission vehicle_type.delete
     */
    softDelete(id: number) {
        return this.http.patch<ApiResponse>(
            `${this.base}/${id}/soft-delete`,
            {}
        );
    }

    /**
     * Xóa vĩnh viễn loại phương tiện (hard delete) (admin)
     * Yêu cầu authentication và permission vehicle_type.delete
     */
    delete(id: number) {
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    /**
     * Kích hoạt/vô hiệu hóa nhiều loại phương tiện (batch toggle) (admin)
     * Yêu cầu authentication và permission vehicle_type.update
     */
    toggleMultiple(data: VehicleTypeBatchRequest) {
        return this.http.patch<ApiResponse>(`${this.base}/toggle-multiple`, {
            ids: data.ids,
            active: data.active
        });
    }

    /**
     * Xóa nhiều loại phương tiện (batch delete) (admin)
     * Yêu cầu authentication và permission vehicle_type.delete
     */
    deleteMultiple(data: VehicleTypeBatchRequest) {
        return this.http.post<ApiResponse>(`${this.base}/delete-multiple`, {
            ids: data.ids,
            hard: data.hard
        });
    }
}

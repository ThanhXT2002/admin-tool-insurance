import { ApiResponse } from '@/interfaces/api-response.interface';
import {
    MenuCategory,
    MenuCategoryCreateDto,
    MenuCategoryTree,
    MenuCategoryUpdateDto
} from '@/interfaces/menu.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Service xử lý API calls cho MenuCategory
 */
@Injectable({
    providedIn: 'root'
})
export class MenuCateService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/menus/categories';

    /**
     * Lấy danh sách menu categories
     */
    getAll(query?: {
        active?: boolean;
        includeItems?: boolean;
        activeItemsOnly?: boolean;
    }) {
        const params: any = {};
        if (query?.active !== undefined && query?.active !== null)
            params.active = String(query.active);
        if (query?.includeItems !== undefined && query?.includeItems !== null)
            params.includeItems = String(query.includeItems);
        if (
            query?.activeItemsOnly !== undefined &&
            query?.activeItemsOnly !== null
        )
            params.activeItemsOnly = String(query.activeItemsOnly);

        return this.http.get<ApiResponse<MenuCategory[]>>(`${this.base}`, {
            params
        });
    }

    /**
     * Lấy chi tiết một menu category
     */
    getById(id: number) {
        return this.http.get<ApiResponse<MenuCategory>>(`${this.base}/${id}`);
    }

    /**
     * Lấy menu category kèm tree structure (PrimeNG format)
     */
    getTreeById(id: number, activeOnly = false) {
        const params: any = {};
        if (activeOnly) params.activeOnly = 'true';

        return this.http.get<ApiResponse<MenuCategoryTree>>(
            `${this.base}/${id}/tree`,
            { params }
        );
    }

    /**
     * Đếm số menu items trong category
     */
    countMenuItems(id: number) {
        return this.http.get<ApiResponse<{ count: number }>>(
            `${this.base}/${id}/count-items`
        );
    }

    /**
     * Tạo menu category mới
     */
    create(data: MenuCategoryCreateDto) {
        return this.http.post<ApiResponse<MenuCategory>>(`${this.base}`, data);
    }

    /**
     * Cập nhật menu category
     */
    update(id: number, data: MenuCategoryUpdateDto) {
        return this.http.put<ApiResponse<MenuCategory>>(
            `${this.base}/${id}`,
            data
        );
    }

    /**
     * Xóa menu category (cascade xóa menu items)
     */
    delete(id: number, hard = true) {
        const params: any = {};
        if (hard !== undefined) params.hard = String(hard);

        return this.http.delete<ApiResponse>(`${this.base}/${id}`, { params });
    }

    /**
     * Batch active/inactive nhiều menu categories
     */
    batchActive(ids: number[], active: boolean) {
        return this.http.post<ApiResponse>(`${this.base}/batch-active`, {
            ids,
            active
        });
    }

    /**
     * API public: Lấy menu theo key (chỉ active) - cho frontend
     */
    getPublicMenuByKey(key: string) {
        return this.http.get<ApiResponse<MenuCategoryTree>>(
            `${environment.apiUrl}/menus/public/${key}`
        );
    }
}

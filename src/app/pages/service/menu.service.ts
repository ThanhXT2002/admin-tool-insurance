import { ApiResponse } from '@/interfaces/api-response.interface';
import {
    MenuItem,
    MenuItemBatchOrderDto,
    MenuItemCreateDto,
    MenuItemReorderDto,
    MenuItemUpdateDto
} from '@/interfaces/menu.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Service xử lý API calls cho MenuItem
 */
@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/menus/items';

    /**
     * Lấy chi tiết menu item
     */
    getById(id: number) {
        return this.http.get<ApiResponse<MenuItem>>(`${this.base}/${id}`);
    }

    /**
     * Lấy menu items theo category (tree structure)
     */
    getByCategory(
        categoryId: number,
        query?: { active?: boolean; includeChildren?: boolean }
    ) {
        const params: any = {};
        if (query?.active !== undefined && query?.active !== null)
            params.active = String(query.active);
        if (
            query?.includeChildren !== undefined &&
            query?.includeChildren !== null
        )
            params.includeChildren = String(query.includeChildren);

        return this.http.get<ApiResponse<MenuItem[]>>(
            `${this.base}/category/${categoryId}`,
            { params }
        );
    }

    /**
     * Lấy tất cả children của menu item
     */
    getChildren(id: number, activeOnly = false) {
        const params: any = {};
        if (activeOnly) params.activeOnly = 'true';

        return this.http.get<ApiResponse<MenuItem[]>>(
            `${this.base}/${id}/children`,
            { params }
        );
    }

    /**
     * Đếm số children của menu item
     */
    countChildren(id: number) {
        return this.http.get<ApiResponse<{ count: number }>>(
            `${this.base}/${id}/count-children`
        );
    }

    /**
     * Tạo menu item mới
     */
    create(data: MenuItemCreateDto) {
        return this.http.post<ApiResponse<MenuItem>>(`${this.base}`, data);
    }

    /**
     * Cập nhật menu item
     */
    update(id: number, data: MenuItemUpdateDto) {
        return this.http.put<ApiResponse<MenuItem>>(`${this.base}/${id}`, data);
    }

    /**
     * Xóa menu item (cascade xóa children)
     */
    delete(id: number, hard = true) {
        const params: any = {};
        if (hard !== undefined) params.hard = String(hard);

        return this.http.delete<ApiResponse>(`${this.base}/${id}`, { params });
    }

    /**
     * Batch active/inactive nhiều menu items
     */
    batchActive(ids: number[], active: boolean) {
        return this.http.post<ApiResponse>(`${this.base}/batch-active`, {
            ids,
            active
        });
    }

    /**
     * Reorder menu items (sau drag-drop)
     */
    reorder(updates: MenuItemReorderDto[]) {
        return this.http.post<ApiResponse>(`${this.base}/reorder`, {
            updates
        });
    }

    /**
     * Batch update order
     */
    batchUpdateOrder(items: MenuItemBatchOrderDto[]) {
        return this.http.post<ApiResponse>(`${this.base}/batch-update-order`, {
            items
        });
    }

    /**
     * Di chuyển menu item sang parent khác
     */
    moveItem(id: number, parentId: number | null, order?: number) {
        return this.http.post<ApiResponse<MenuItem>>(
            `${this.base}/${id}/move`,
            {
                parentId,
                order
            }
        );
    }

    /**
     * Duplicate (copy) menu item
     */
    duplicate(id: number) {
        return this.http.post<ApiResponse<MenuItem>>(
            `${this.base}/${id}/duplicate`,
            {}
        );
    }
}

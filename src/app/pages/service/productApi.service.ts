import { ApiResponse } from '@/interfaces/api-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
    Product,
    ProductCreateDto,
    ProductUpdateDto
} from '@/interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/products';

    getAll(query?: {
        page?: number;
        limit?: number;
        keyword?: string;
        active?: boolean;
    }) {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        if (query?.active !== undefined && query?.active !== null)
            params.active = String(query.active);
        return this.http.get<ApiResponse<{ rows: Product[]; total: number }>>(
            `${this.base}`,
            { params }
        );
    }

    getById(id: number) {
        return this.http.get<ApiResponse<Product>>(`${this.base}/${id}`);
    }

    getBySlug(slug: string) {
        return this.http.get<ApiResponse<Product>>(
            `${this.base}/slug/${encodeURIComponent(slug)}`
        );
    }

    create(data: ProductCreateDto | FormData) {
        if (data instanceof FormData)
            return this.http.post<ApiResponse<Product>>(
                `${this.base}`,
                data as any
            );
        const fd = this.buildFormData(data as any);
        return this.http.post<ApiResponse<Product>>(`${this.base}`, fd as any);
    }

    update(id: number, data: ProductUpdateDto | FormData) {
        if (data instanceof FormData)
            return this.http.put<ApiResponse<Product>>(
                `${this.base}/${id}`,
                data as any
            );
        const fd = this.buildFormData(data as any);
        return this.http.put<ApiResponse<Product>>(
            `${this.base}/${id}`,
            fd as any
        );
    }

    delete(id: number) {
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    deleteMultiple(ids: number[]) {
        return this.http.post<ApiResponse>(`${this.base}/batch/delete`, {
            ids
        });
    }

    // Combined activate/deactivate endpoint
    batchActive(ids: number[], active: boolean) {
        return this.http.post<ApiResponse>(`${this.base}/batch/active`, {
            ids,
            active
        });
    }

    // Build FormData for create/update when uploading images
    private buildFormData(payload: any): FormData {
        const fd = new FormData();
        for (const key of Object.keys(payload)) {
            const val = payload[key];
            if (val === undefined || val === null) continue;
            if (key === 'id') continue;

            if (key === 'imgs') {
                if (Array.isArray(val)) {
                    for (const item of val) {
                        if (item instanceof File)
                            fd.append('imgs', item, item.name);
                        else if (typeof item === 'string')
                            fd.append('imgs', item);
                        else fd.append('imgs', JSON.stringify(item));
                    }
                }
                continue;
            }

            if (Array.isArray(val)) {
                fd.append(key, JSON.stringify(val));
            } else if (
                val &&
                typeof val === 'object' &&
                !(val instanceof File)
            ) {
                fd.append(key, JSON.stringify(val));
            } else if (typeof val === 'boolean') {
                fd.append(key, String(val));
            } else fd.append(key, String(val));
        }
        return fd;
    }
}

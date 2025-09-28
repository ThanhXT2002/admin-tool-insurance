import { ApiResponse } from '@/interfaces/api-response.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Interface mô tả một bản ghi liên hệ trả về từ API
 */
export interface ContactItem {
    id: number;
    name?: string;
    email?: string;
    message: string;
    ip?: string;
    userAgent?: string;
    createdAt: string;
}

/**
 * Service gọi API cho feature Contact (Admin)
 * - Sử dụng `inject()` thay vì constructor injection theo style Angular 20
 * - Provided in root để dùng làm singleton
 */
@Injectable({ providedIn: 'root' })
export class ContactApiService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/contact';

    /**
     * Lấy danh sách contact với phân trang và tìm kiếm
     * Trả về Observable của ApiResponse chứa rows và total
     */
    getAll(query?: { page?: number; limit?: number; keyword?: string }) {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        return this.http.get<
            ApiResponse<{ rows: ContactItem[]; total: number }>
        >(`${this.base}`, { params });
    }

}

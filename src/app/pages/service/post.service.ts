import { ApiResponse } from '@/interfaces/api-response.interface';
import { PaginationQuery } from '@/interfaces/paginate-query.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    Post,
    PostCreateDto,
    PostUpdateDto
} from '@/interfaces/post.interface';

@Injectable({
    providedIn: 'root'
})
export class PostService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/posts';

    // Mục đích: Lấy danh sách bài viết (dành cho admin) có hỗ trợ phân trang, tìm kiếm và lọc
    // Tham số: page, limit, keyword, status, categoryId, postType, isFeatured, isHighlighted
    getAll(
        query?: PaginationQuery & {
            status?: string;
            categoryId?: number;
            postType?: string;
            isFeatured?: boolean;
            isHighlighted?: boolean;
        }
    ) {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        if (query?.status) params.status = query.status;
        if (query?.categoryId != null)
            params.categoryId = String(query.categoryId);
        if (query?.postType) params.postType = query.postType;
        if (query?.isFeatured !== undefined && query?.isFeatured !== null)
            params.isFeatured = String(query.isFeatured);
        if (query?.isHighlighted !== undefined && query?.isHighlighted !== null)
            params.isHighlighted = String(query.isHighlighted);
        return this.http.get<ApiResponse<{ rows: Post[]; total: number }>>(
            `${this.base}`,
            { params }
        );
    }

    // Mục đích: Lấy danh sách bài viết đã xuất bản (public) dùng cho trang công khai, có phân trang
    // Tham số: page, limit, categoryId, postType
    getPublished(
        query?: PaginationQuery & { categoryId?: number; postType?: string }
    ) {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.categoryId != null)
            params.categoryId = String(query.categoryId);
        if (query?.postType) params.postType = query.postType;
        return this.http.get<ApiResponse<{ rows: Post[]; total: number }>>(
            `${this.base}/published`,
            { params }
        );
    }

    // Mục đích: Lấy chi tiết bài viết theo ID (dành cho admin/detail view)
    getById(id: number) {
        return this.http.get<ApiResponse<Post>>(`${this.base}/${id}`);
    }

    // create accepts either DTO or FormData (for file uploads)
    create(data: PostCreateDto | FormData) {
        // Mục đích: Tạo bài viết mới. Hỗ trợ gửi FormData để upload ảnh (featuredImage, albumImages)
        if (data instanceof FormData)
            return this.http.post<ApiResponse<Post>>(
                `${this.base}`,
                data as any
            );
        const fd = this.buildFormData(data as any);
        return this.http.post<ApiResponse<Post>>(`${this.base}`, fd as any);
    }

    update(id: number, data: PostUpdateDto | FormData) {
        // Mục đích: Cập nhật bài viết theo ID. Chấp nhận DTO hoặc FormData khi cần upload ảnh mới
        if (data instanceof FormData)
            return this.http.put<ApiResponse<Post>>(
                `${this.base}/${id}`,
                data as any
            );
        const fd = this.buildFormData(data as any);
        return this.http.put<ApiResponse<Post>>(
            `${this.base}/${id}`,
            fd as any
        );
    }

    delete(id: number) {
        // Mục đích: Xóa 1 bài viết theo ID
        return this.http.delete<ApiResponse>(`${this.base}/${id}`);
    }

    deleteMultiple(ids: number[]) {
        // Mục đích: Xóa nhiều bài viết theo danh sách ID (batch delete)
        return this.http.post<ApiResponse>(`${this.base}/batch/delete`, {
            ids
        });
    }

    publish(id: number) {
        // Mục đích: Đổi trạng thái 1 bài viết thành PUBLISHED
        return this.http.put<ApiResponse<Post>>(
            `${this.base}/${id}/publish`,
            {}
        );
    }

    unpublish(id: number) {
        // Mục đích: Đổi trạng thái 1 bài viết về DRAFT (gỡ xuất bản)
        return this.http.put<ApiResponse<Post>>(
            `${this.base}/${id}/unpublish`,
            {}
        );
    }

    archive(id: number) {
        // Mục đích: Đổi trạng thái 1 bài viết thành ARCHIVED (lưu trữ)
        return this.http.put<ApiResponse<Post>>(
            `${this.base}/${id}/archive`,
            {}
        );
    }

    publishMultiple(ids: number[]) {
        // Mục đích: Xuất bản nhiều bài viết cùng lúc (batch)
        return this.http.post<ApiResponse>(`${this.base}/batch/publish`, {
            ids
        });
    }

    unpublishMultiple(ids: number[]) {
        // Mục đích: Gỡ xuất bản nhiều bài viết cùng lúc (batch)
        return this.http.post<ApiResponse>(`${this.base}/batch/unpublish`, {
            ids
        });
    }

    archiveMultiple(ids: number[]) {
        // Mục đích: Lưu trữ nhiều bài viết cùng lúc (batch)
        return this.http.post<ApiResponse>(`${this.base}/batch/archive`, {
            ids
        });
    }

    // Build FormData: handles featuredImage (single File) and albumImages (array of Files)
    // Mục đích: Chuyển DTO sang FormData để upload file. Các mảng được stringify (backend sẽ parse JSON)
    private buildFormData(payload: any): FormData {
        const fd = new FormData();
        for (const key of Object.keys(payload)) {
            const val = payload[key];
            if (val === undefined || val === null) continue;
            if (key === 'id') continue;

            if (key === 'featuredImage') {
                if (val instanceof File)
                    fd.append('featuredImage', val, (val as File).name);
                continue;
            }

            if (key === 'albumImages') {
                if (Array.isArray(val)) {
                    for (const file of val) {
                        if (file instanceof File)
                            fd.append('albumImages', file, file.name);
                    }
                }
                continue;
            }

            // Arrays are stringified (backend will parse JSON)
            if (Array.isArray(val)) fd.append(key, JSON.stringify(val));
            else if (typeof val === 'boolean') fd.append(key, String(val));
            else fd.append(key, String(val));
        }
        return fd;
    }
}

import { ApiResponse } from '@/interfaces/api-response.interface';
import { Seo } from '@/interfaces/seo.interface';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PostCategory {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    parentId?: number | null;
    order?: number;
    active: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    children?: PostCategory[];
    parent?: PostCategory | null;
    posts?: { id: number; title: string; slug: string }[];
    seoMeta?: Seo;
}

export interface PostCategoryDto {
    name: string;
    description?: string;
    parentId?: number;
    order: number;
    active?: boolean;
    seoMeta?: Seo;
}

export interface PostCategoryNestedParams {
    page?: number;
    limit?: number;
    keyword?: string;
    active?: boolean;
    parentId?: number | null;
    includeInactive?: boolean | string;
}

@Injectable({
    providedIn: 'root'
})
export class PostCategoryService {
    private http = inject(HttpClient);
    private base = environment.apiUrl + '/post-categories';

    getAll(query?: {
        page?: number;
        limit?: number;
        keyword?: string;
        active?: boolean;
        parentId?: number;
    }): Observable<ApiResponse<{ rows: PostCategory[]; total: number }>> {
        const params: any = {};
        if (query?.page != null) params.page = query.page;
        if (query?.limit != null) params.limit = query.limit;
        if (query?.keyword) params.keyword = query.keyword;
        if (query?.active != null) params.active = String(query.active);
        if (query?.parentId != null) params.parentId = query.parentId;

        return this.http.get<
            ApiResponse<{ rows: PostCategory[]; total: number }>
        >(`${this.base}`, { params });
    }

    getTree(): Observable<ApiResponse<PostCategory[]>> {
        return this.http.get<ApiResponse<PostCategory[]>>(`${this.base}/tree`);
    }

    getRoots(): Observable<ApiResponse<PostCategory[]>> {
        return this.http.get<ApiResponse<PostCategory[]>>(`${this.base}/roots`);
    }

    getBySlug(slug: string): Observable<ApiResponse<PostCategory>> {
        return this.http.get<ApiResponse<PostCategory>>(
            `${this.base}/slug/${encodeURIComponent(slug)}`
        );
    }

    getById(id: number): Observable<ApiResponse<PostCategory>> {
        return this.http.get<ApiResponse<PostCategory>>(`${this.base}/${id}`);
    }

    create(data: PostCategoryDto): Observable<ApiResponse<PostCategory>> {
        return this.http.post<ApiResponse<PostCategory>>(`${this.base}`, data);
    }

    update(
        id: number,
        data: PostCategoryDto
    ): Observable<ApiResponse<PostCategory>> {
        return this.http.put<ApiResponse<PostCategory>>(
            `${this.base}/${id}`,
            data
        );
    }

    delete(id: number, force?: boolean): Observable<ApiResponse> {
        const params: Record<string, string> = {};
        if (force != null) params['force'] = String(force);

        return this.http.delete<ApiResponse>(`${this.base}/${id}`, {
            params,
            observe: 'body' as const
        });
    }

    batchDelete(ids: number[], force?: boolean): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/batch/delete`, {
            ids,
            force
        });
    }

    batchActive(ids: number[], active: boolean): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.base}/batch/active`, {
            ids,
            active
        });
    }

    // New: nested tree endpoints
    getNested(
        params?: PostCategoryNestedParams
    ): Observable<ApiResponse<PostCategory[] | null>> {
        const p: any = {};
        if (params?.page != null) p.page = params.page;
        if (params?.limit != null) p.limit = params.limit;
        if (params?.keyword) p.keyword = params.keyword;
        if (params?.active != null) p.active = String(params.active);
        if (params?.parentId != null) p.parentId = params.parentId;
        if (typeof params?.includeInactive !== 'undefined')
            p.includeInactive = String(params.includeInactive);

        return this.http.get<ApiResponse<PostCategory[] | null>>(
            `${this.base}/nested`,
            { params: p }
        );
    }

    getNestedById(
        id: number,
        params?: Omit<PostCategoryNestedParams, 'parentId'>
    ): Observable<ApiResponse<PostCategory | null>> {
        const p: any = {};
        if (params?.page != null) p.page = params.page;
        if (params?.limit != null) p.limit = params.limit;
        if (params?.keyword) p.keyword = params.keyword;
        if (params?.active != null) p.active = String(params.active);
        if (typeof params?.includeInactive !== 'undefined')
            p.includeInactive = String(params.includeInactive);

        return this.http.get<ApiResponse<PostCategory | null>>(
            `${this.base}/nested/${id}`,
            { params: p }
        );
    }
}

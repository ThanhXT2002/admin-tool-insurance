import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '../_base/base-store-signal';
import { Post } from '@/interfaces/post.interface';
import { PostService } from '@/pages/service/post.service';

interface PostListState {
    rows: Post[];
    total: number;
    page: number;
    limit: number;

    keyword?: string;
    // filters
    status?: string;
    categoryId?: number;
    postType?: string;
    isFeatured?: boolean;
    isHighlighted?: boolean;
    // Lưu filter params hiện tại để so sánh khi hydrate
    currentFilter?: {
        status?: string;
        categoryId?: number;
        postType?: string;
        isFeatured?: boolean;
        isHighlighted?: boolean;
        keyword?: string;
    };
}

@Injectable({ providedIn: 'root' })
export class PostStore extends BaseStoreSignal<PostListState> {
    private postService = inject(PostService);
    private router = inject(Router);

    // Cache để tránh gọi API trùng lặp
    private _lastApiCall: string | null = null;

    // Các signal suy diễn (derived)
    public rows = this.select((s) => s.rows);
    public total = this.select((s) => s.total);
    public page = this.select((s) => s.page);
    public limit = this.select((s) => s.limit);
    public keyword = this.select((s) => s.keyword);
    public status = this.select((s) => s.status);
    public categoryId = this.select((s) => s.categoryId);
    public postType = this.select((s) => s.postType);
    public isFeatured = this.select((s) => s.isFeatured);
    public isHighlighted = this.select((s) => s.isHighlighted);

    // Giá trị tính toán tiện lợi
    public hasMore = computed(() => this.total() > this.rows().length);

    protected getInitialState() {
        return { rows: [], total: 0, page: 1, limit: 10 } as PostListState;
    }

    // Tải danh sách với tham số tuỳ chọn (sẽ merge vào state hiện tại)
    async load(
        params?: Partial<PostListState>,
        options?: { skipSync?: boolean }
    ) {
        // update local query params
        if (params) {
            // if filters changed, ensure page resets to 1 by default
            const resettingPage =
                params.page == null &&
                (params.keyword !== undefined ||
                    params.status !== undefined ||
                    params.categoryId !== undefined ||
                    params.postType !== undefined ||
                    params.isFeatured !== undefined ||
                    params.isHighlighted !== undefined);
            if (resettingPage) params = { ...params, page: 1 };
            this.patch(params);
            // sync filter-related params to URL so links are shareable
            // allow callers to skip syncing (useful during initial hydrate from URL)
            if (!options?.skipSync) this.syncQueryParamsToUrl();
        }

        const q = this.snapshot();

        // Tạo cache key từ params để tránh gọi API trùng lặp
        const cacheKey = JSON.stringify({
            page: q.page,
            limit: q.limit,
            keyword: q.keyword,
            status: q.status,
            categoryId: q.categoryId,
            postType: q.postType,
            isFeatured: q.isFeatured,
            isHighlighted: q.isHighlighted
        });

        // Nếu API call giống hệt lần trước và có data, bỏ qua
        if (this._lastApiCall === cacheKey && q.rows.length > 0) {
            return { rows: q.rows, total: q.total };
        }

        this._lastApiCall = cacheKey;

        const result: any = await this.run(() =>
            firstValueFrom(
                this.postService.getAll({
                    page: q.page,
                    limit: q.limit,
                    keyword: q.keyword,
                    status: q.status,
                    categoryId: q.categoryId,
                    postType: q.postType,
                    isFeatured: q.isFeatured,
                    isHighlighted: q.isHighlighted
                })
            )
        );
        // ApiResponse shape { data: { rows, total } }
        const payload: any = (result as any).data;
        // Lưu cả currentFilter vào state
        this.patch({
            rows: payload.rows || [],
            total: payload.total || 0,
            currentFilter: {
                status: q.status,
                categoryId: q.categoryId,
                postType: q.postType,
                isFeatured: q.isFeatured,
                isHighlighted: q.isHighlighted,
                keyword: q.keyword
            }
        });
        return payload;
    }

    async refresh() {
        const q = this.snapshot();
        return this.load({ page: q.page });
    }

    // Set filters programmatically (resets page to 1)
    setFilters(filters: Partial<PostListState>) {
        this.load({ ...filters, page: 1 });
    }

    setKeyword(keyword?: string) {
        this.load({ keyword, page: 1 });
    }

    // Hydrate store from raw query params (e.g., ActivatedRoute.snapshot.queryParams)
    // Accepts an object of string values and converts them to proper types before loading
    hydrateFromQueryParams(qp: Record<string, any>) {
        const parsed: Partial<PostListState> = {};

        // Parse query params (n\u1ebfu c\u00f3)
        if (qp && Object.keys(qp).length > 0) {
            if (qp['page']) parsed.page = Number(qp['page']) || 1;
            if (qp['limit']) parsed.limit = Number(qp['limit']) || 10;
            if (qp['keyword']) parsed.keyword = qp['keyword'];
            if (qp['status']) parsed.status = qp['status'];
            if (qp['categoryId']) parsed.categoryId = Number(qp['categoryId']);
            if (qp['postType']) parsed.postType = qp['postType'];
            if (qp['isFeatured'] !== undefined)
                parsed.isFeatured = qp['isFeatured'] === 'true';
            if (qp['isHighlighted'] !== undefined)
                parsed.isHighlighted = qp['isHighlighted'] === 'true';
        }

        // Ki\u1ec3m tra cache
        const currentState = this.snapshot();
        const hasCachedData = currentState.rows.length > 0;
        const hasUrlParams = Object.keys(parsed).length > 0;

        // So s\u00e1nh filter: URL params vs cache filter
        const filterMatches =
            hasCachedData &&
            currentState.currentFilter?.status === parsed.status &&
            currentState.currentFilter?.categoryId === parsed.categoryId &&
            currentState.currentFilter?.postType === parsed.postType &&
            currentState.currentFilter?.isFeatured === parsed.isFeatured &&
            currentState.currentFilter?.isHighlighted ===
                parsed.isHighlighted &&
            currentState.currentFilter?.keyword === parsed.keyword;

        if (!filterMatches) {
            // Kh\u00f4ng c\u00f3 cache ho\u1eb7c filter kh\u00f4ng kh\u1edbp -> g\u1ecdi API
            this.load(parsed, { skipSync: true });
        }

        // N\u1ebfu kh\u00f4ng c\u00f3 URL params nh\u01b0ng c\u00f3 cache data, sync URL v\u1edbi cache
        if (!hasUrlParams && hasCachedData) {
            this.syncQueryParamsToUrl();
        }

        // Return parsed v\u1edbi th\u00f4ng tin v\u1ec1 vi\u1ec7c c\u00f3 match cache hay kh\u00f4ng
        return {
            ...parsed,
            _cacheMatched: filterMatches,
            _hasCachedData: hasCachedData
        } as any;
    }

    // Lấy chi tiết một bài viết theo id (gọi backend)
    async fetchById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.getById(id))
        );
        return (res as any).data as Post;
    }

    // Tạo mới và đưa vào danh sách (prepend). Nếu muốn có thể refetch thay vì thêm trực tiếp.
    async create(payload: any) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.create(payload))
        );
        // prepend new item to rows
        const created = res.data as Post;
        this._state.update((s) => ({
            ...s,
            rows: [created, ...s.rows],
            total: s.total + 1
        }));
        return created;
    }

    async update(id: number, payload: any) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.update(id, payload))
        );
        const updated = res.data as Post;
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
        }));
        return updated;
    }

    async delete(id: number) {
        await this.run(() => firstValueFrom(this.postService.delete(id)));
        // Loại bỏ item khỏi danh sách trong store sau khi backend xóa thành công
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => r.id !== id),
            total: Math.max(0, s.total - 1)
        }));
        return true;
    }

    async deleteMultiple(ids: number[]) {
        await this.run(() =>
            firstValueFrom(this.postService.deleteMultiple(ids))
        );
        // Xoá nhiều item khỏi state sau khi backend trả về thành công
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => !ids.includes(r.id)),
            total: Math.max(0, s.total - ids.length)
        }));
        return true;
    }

    // Đổi trạng thái 1 bài viết thành PUBLISHED (cập nhật state cục bộ)
    async publish(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.publish(id))
        );
        const updated: Post | undefined = res?.data;
        if (updated) {
            // nếu backend trả về object đã cập nhật, thay thế hàng tương ứng
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
            }));
            return updated;
        }

        // nếu backend không trả về object chi tiết, thực hiện cập nhật trạng thái tối ưu
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                r.id === id
                    ? {
                          ...r,
                          status: 'PUBLISHED',
                          publishedAt: new Date().toISOString()
                      }
                    : r
            )
        }));
        return true;
    }

    // Gỡ xuất bản 1 bài viết (về DRAFT) - cập nhật state cục bộ
    async unpublish(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.unpublish(id))
        );
        const updated: Post | undefined = res?.data;
        if (updated) {
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
            }));
            return updated;
        }
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                r.id === id ? { ...r, status: 'DRAFT' } : r
            )
        }));
        return true;
    }

    // Lưu trữ 1 bài viết - cập nhật state cục bộ
    async archive(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.archive(id))
        );
        const updated: Post | undefined = res?.data;
        if (updated) {
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
            }));
            return updated;
        }
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                r.id === id ? { ...r, status: 'ARCHIVED' } : r
            )
        }));
        return true;
    }

    // Batch: xuất bản nhiều bài viết - cập nhật state cục bộ
    async publishMultiple(ids: number[]) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.publishMultiple(ids))
        );
        const data: any = res?.data;
        if (Array.isArray(data) && data.length > 0) {
            // nếu backend trả về danh sách bài viết đã cập nhật
            const updatedIds = new Set(data.map((d: any) => d.id));
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) =>
                    updatedIds.has(r.id)
                        ? { ...r, ...data.find((d: any) => d.id === r.id) }
                        : r
                )
            }));
            return data;
        }

        // tối ưu: cập nhật trạng thái cho các id được chỉ định
        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                idSet.has(r.id)
                    ? {
                          ...r,
                          status: 'PUBLISHED',
                          publishedAt: new Date().toISOString()
                      }
                    : r
            )
        }));
        return true;
    }

    // Batch: gỡ xuất bản nhiều bài viết - cập nhật state cục bộ
    async unpublishMultiple(ids: number[]) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.unpublishMultiple(ids))
        );
        const data: any = res?.data;
        if (Array.isArray(data) && data.length > 0) {
            const updatedIds = new Set(data.map((d: any) => d.id));
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) =>
                    updatedIds.has(r.id)
                        ? { ...r, ...data.find((d: any) => d.id === r.id) }
                        : r
                )
            }));
            return data;
        }
        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                idSet.has(r.id) ? { ...r, status: 'DRAFT' } : r
            )
        }));
        return true;
    }

    // Batch: lưu trữ nhiều bài viết - cập nhật state cục bộ
    async archiveMultiple(ids: number[]) {
        const res: any = await this.run(() =>
            firstValueFrom(this.postService.archiveMultiple(ids))
        );
        const data: any = res?.data;
        if (Array.isArray(data) && data.length > 0) {
            const updatedIds = new Set(data.map((d: any) => d.id));
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) =>
                    updatedIds.has(r.id)
                        ? { ...r, ...data.find((d: any) => d.id === r.id) }
                        : r
                )
            }));
            return data;
        }
        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) =>
                idSet.has(r.id) ? { ...r, status: 'ARCHIVED' } : r
            )
        }));
        return true;
    }

    // Tải trang tiếp theo và thêm kết quả vào rows (cuộn vô hạn / tải thêm)
    async loadMore() {
        const q = this.snapshot();
        const nextPage = (q.page || 1) + 1;
        const result: any = await this.run(() =>
            firstValueFrom(
                this.postService.getAll({
                    page: nextPage,
                    limit: q.limit,
                    keyword: q.keyword,
                    status: q.status,
                    categoryId: q.categoryId,
                    postType: q.postType,
                    isFeatured: q.isFeatured,
                    isHighlighted: q.isHighlighted
                })
            )
        );
        const payload: any = result.data;
        const newRows: Post[] = payload.rows || [];
        // Ghép thêm các kết quả trang mới vào danh sách hiện tại
        this._state.update((s) => ({
            ...s,
            rows: [...s.rows, ...newRows],
            page: nextPage,
            total: payload.total || s.total
        }));
        return payload;
    }

    private syncQueryParamsToUrl() {
        const q = this.snapshot();
        const params: any = {};
        if (q.page) params.page = String(q.page);
        if (q.limit) params.limit = String(q.limit);
        if (q.keyword) params.keyword = q.keyword;
        if (q.status) params.status = q.status;
        if (q.categoryId != null) params.categoryId = String(q.categoryId);
        if (q.postType) params.postType = q.postType;
        if (q.isFeatured !== undefined && q.isFeatured !== null)
            params.isFeatured = String(q.isFeatured);
        if (q.isHighlighted !== undefined && q.isHighlighted !== null)
            params.isHighlighted = String(q.isHighlighted);

        try {
            // Avoid unnecessary navigations: compare current snapshot query params
            const currentParams =
                this.router.routerState.snapshot.root.queryParams || {};
            const keys = new Set([
                ...Object.keys(currentParams),
                ...Object.keys(params)
            ]);
            let identical = true;
            for (const k of keys) {
                const a = currentParams[k];
                const b = params[k];
                if (
                    (a === undefined || a === null || a === '') &&
                    (b === undefined || b === null || b === '')
                )
                    continue;
                if (String(a) !== String(b)) {
                    identical = false;
                    break;
                }
            }
            if (!identical) {
                this.router.navigate([], {
                    queryParams: params,
                    replaceUrl: true
                });
            }
        } catch (err) {
            // ignore router errors in non-router contexts (e.g., tests)
        }
    }
}

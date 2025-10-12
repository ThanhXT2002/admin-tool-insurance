import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '@/store/_base/base-store-signal';
import { VehicleTypeService } from '@/pages/service/vehicle-type.service';
import {
    VehicleType,
    VehicleTypeCreateDto,
    VehicleTypeUpdateDto,
    UsageType,
    UsagePurpose
} from '@/interfaces/vehicle-type.interface';

/**
 * Interface định nghĩa state cho danh sách loại phương tiện
 * Bao gồm dữ liệu pagination, filters và cache
 */
interface VehicleTypeListState {
    rows: VehicleType[];
    total: number;
    page: number;
    limit: number;

    keyword?: string;
    // Filters
    active?: boolean;
    usageType?: UsageType;
    usagePurpose?: UsagePurpose;

    // Cache filter params để so sánh khi hydrate
    currentFilter?: {
        active?: boolean;
        usageType?: UsageType;
        usagePurpose?: UsagePurpose;
        keyword?: string;
    };
}

/**
 * Store quản lý state cho VehicleType sử dụng Angular Signals
 * Cung cấp các phương thức CRUD và state management
 */
@Injectable({ providedIn: 'root' })
export class VehicleTypeStore extends BaseStoreSignal<VehicleTypeListState> {
    private vehicleTypeService = inject(VehicleTypeService);
    private router = inject(Router);

    // Cache để tránh gọi API trùng lặp
    private _lastApiCall: string | null = null;

    // Các signal suy diễn (derived)
    public rows = this.select((s) => s.rows);
    public total = this.select((s) => s.total);
    public page = this.select((s) => s.page);
    public limit = this.select((s) => s.limit);
    public keyword = this.select((s) => s.keyword);
    public active = this.select((s) => s.active);
    public usageType = this.select((s) => s.usageType);
    public usagePurpose = this.select((s) => s.usagePurpose);

    // Giá trị tính toán tiện lợi
    public hasMore = computed(() => this.total() > this.rows().length);

    /**
     * Trả về state mặc định khi khởi tạo hoặc reset store
     */
    protected getInitialState() {
        return {
            rows: [],
            total: 0,
            page: 1,
            limit: 10
        } as VehicleTypeListState;
    }

    /**
     * Tải danh sách loại phương tiện với tham số tuỳ chọn (merge vào state hiện tại)
     * @param params - Các tham số filter và pagination
     * @param options - Tùy chọn bỏ qua sync URL params
     */
    async load(
        params?: Partial<VehicleTypeListState>,
        options?: { skipSync?: boolean }
    ) {
        // Cập nhật local query params
        if (params) {
            this.patch(params);
        }

        const q = this.snapshot();

        // Tạo cache key từ params để tránh gọi API trùng lặp
        const cacheKey = JSON.stringify({
            page: q.page,
            limit: q.limit,
            keyword: q.keyword,
            active: q.active,
            usageType: q.usageType,
            usagePurpose: q.usagePurpose
        });

        // Nếu API call giống hệt lần trước và có data, bỏ qua
        if (this._lastApiCall === cacheKey && q.rows.length > 0) {
            return { rows: q.rows, total: q.total };
        }

        this._lastApiCall = cacheKey;

        const result: any = await this.run(() =>
            firstValueFrom(
                this.vehicleTypeService.getAll({
                    page: q.page,
                    limit: q.limit,
                    keyword: q.keyword,
                    active: q.active,
                    usageType: q.usageType,
                    usagePurpose: q.usagePurpose
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
                active: q.active,
                usageType: q.usageType,
                usagePurpose: q.usagePurpose,
                keyword: q.keyword
            }
        });

        // Sync URL params nếu không skip
        if (!options?.skipSync) {
            this.syncQueryParamsToUrl();
        }

        return payload;
    }

    /**
     * Refresh lại dữ liệu với params hiện tại
     */
    async refresh() {
        const q = this.snapshot();
        return this.load({ page: q.page });
    }

    /**
     * Set filters programmatically (resets page to 1)
     */
    setFilters(filters: Partial<VehicleTypeListState>) {
        this.load({ ...filters, page: 1 });
    }

    /**
     * Set từ khóa tìm kiếm (resets page to 1)
     */
    setKeyword(keyword?: string) {
        this.load({ keyword, page: 1 });
    }

    /**
     * Hydrate store từ raw query params (ví dụ ActivatedRoute.snapshot.queryParams)
     * Accepts một object string values và convert thành proper types trước khi load
     */
    hydrateFromQueryParams(qp: Record<string, any>) {
        const parsed: Partial<VehicleTypeListState> = {};

        // Parse query params (nếu có)
        if (qp && Object.keys(qp).length > 0) {
            if (qp['page']) parsed.page = parseInt(qp['page']) || 1;
            if (qp['limit']) parsed.limit = parseInt(qp['limit']) || 10;
            if (qp['keyword']) parsed.keyword = qp['keyword'];
            if (qp['active']) parsed.active = qp['active'] === 'true';
            if (qp['usageType'])
                parsed.usageType = qp['usageType'] as UsageType;
            if (qp['usagePurpose'])
                parsed.usagePurpose = qp['usagePurpose'] as UsagePurpose;
        }

        // Kiểm tra cache
        const currentState = this.snapshot();
        const hasCachedData = currentState.rows.length > 0;
        const hasUrlParams = Object.keys(parsed).length > 0;

        // So sánh filter: URL params vs cache filter
        const filterMatches =
            hasCachedData &&
            currentState.currentFilter?.active === parsed.active &&
            currentState.currentFilter?.usageType === parsed.usageType &&
            currentState.currentFilter?.usagePurpose === parsed.usagePurpose &&
            currentState.currentFilter?.keyword === parsed.keyword;

        if (!filterMatches) {
            // Load với params từ URL
            this.load(parsed, { skipSync: true });
        }

        // Nếu không có URL params nhưng có cache data, sync URL với cache
        if (!hasUrlParams && hasCachedData) {
            this.syncQueryParamsToUrl();
        }

        // Return parsed với thông tin về việc có match cache hay không
        return {
            ...parsed,
            _cacheMatched: filterMatches,
            _hasCachedData: hasCachedData
        } as any;
    }

    /**
     * Lấy chi tiết một loại phương tiện theo id (gọi backend)
     */
    async fetchById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.vehicleTypeService.getById(id))
        );
        return (res as any).data as VehicleType;
    }

    /**
     * Tạo mới loại phương tiện và đưa vào đầu danh sách (prepend)
     */
    async create(payload: VehicleTypeCreateDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.vehicleTypeService.create(payload))
        );
        const newItem = (res as any).data as VehicleType;

        // Thêm vào đầu danh sách
        const currentRows = this.snapshot().rows;
        this.patch({
            rows: [newItem, ...currentRows],
            total: this.snapshot().total + 1
        });

        return newItem;
    }

    /**
     * Cập nhật loại phương tiện và sync trong danh sách
     */
    async update(id: number, payload: VehicleTypeUpdateDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.vehicleTypeService.update(id, payload))
        );
        const updatedItem = (res as any).data as VehicleType;

        // Cập nhật trong danh sách
        const currentRows = this.snapshot().rows;
        const updatedRows = currentRows.map((item) =>
            item.id === id ? updatedItem : item
        );
        this.patch({ rows: updatedRows });

        return updatedItem;
    }

    /**
     * Xóa loại phương tiện và loại bỏ khỏi danh sách
     */
    async delete(id: number) {
        await this.run(() =>
            firstValueFrom(this.vehicleTypeService.delete(id))
        );

        // Loại bỏ khỏi danh sách
        const currentRows = this.snapshot().rows;
        const filteredRows = currentRows.filter((item) => item.id !== id);
        this.patch({
            rows: filteredRows,
            total: this.snapshot().total - 1
        });
    }

    /**
     * Soft delete - vô hiệu hóa loại phương tiện
     */
    async softDelete(id: number) {
        await this.run(() =>
            firstValueFrom(this.vehicleTypeService.softDelete(id))
        );

        // Cập nhật active = false trong danh sách
        const currentRows = this.snapshot().rows;
        const updatedRows = currentRows.map((item) =>
            item.id === id ? { ...item, active: false } : item
        );
        this.patch({ rows: updatedRows });
    }

    /**
     * Batch toggle active status cho nhiều items
     */
    async toggleMultiple(ids: number[], active: boolean) {
        await this.run(() =>
            firstValueFrom(
                this.vehicleTypeService.toggleMultiple({ ids, active })
            )
        );

        // Cập nhật trong danh sách
        const currentRows = this.snapshot().rows;
        const updatedRows = currentRows.map((item) =>
            ids.includes(item.id) ? { ...item, active } : item
        );
        this.patch({ rows: updatedRows });
    }

    /**
     * Batch delete nhiều items
     */
    async deleteMultiple(ids: number[], hard: boolean = false) {
        await this.run(() =>
            firstValueFrom(
                this.vehicleTypeService.deleteMultiple({ ids, hard })
            )
        );

        if (hard) {
            // Hard delete - loại bỏ khỏi danh sách
            const currentRows = this.snapshot().rows;
            const filteredRows = currentRows.filter(
                (item) => !ids.includes(item.id)
            );
            this.patch({
                rows: filteredRows,
                total: this.snapshot().total - ids.length
            });
        } else {
            // Soft delete - set active = false
            const currentRows = this.snapshot().rows;
            const updatedRows = currentRows.map((item) =>
                ids.includes(item.id) ? { ...item, active: false } : item
            );
            this.patch({ rows: updatedRows });
        }
    }

    /**
     * Tải trang tiếp theo và thêm kết quả vào rows (infinite scroll / load more)
     */
    async loadMore() {
        const currentState = this.snapshot();
        const nextPage = currentState.page + 1;

        // Kiểm tra còn data để load không
        if (currentState.rows.length >= currentState.total) {
            return { rows: [], total: currentState.total };
        }

        const result: any = await this.run(() =>
            firstValueFrom(
                this.vehicleTypeService.getAll({
                    page: nextPage,
                    limit: currentState.limit,
                    keyword: currentState.keyword,
                    active: currentState.active,
                    usageType: currentState.usageType,
                    usagePurpose: currentState.usagePurpose
                })
            )
        );

        const payload: any = (result as any).data;
        const newRows = payload.rows || [];

        // Append vào danh sách hiện tại
        this.patch({
            rows: [...currentState.rows, ...newRows],
            page: nextPage,
            total: payload.total || currentState.total
        });

        return payload;
    }

    /**
     * Sync query params hiện tại lên URL
     */
    private syncQueryParamsToUrl() {
        const state = this.snapshot();
        const queryParams: any = {};

        // Chỉ thêm vào URL những params có giá trị
        if (state.page && state.page !== 1) queryParams.page = state.page;
        if (state.limit && state.limit !== 10) queryParams.limit = state.limit;
        if (state.keyword) queryParams.keyword = state.keyword;
        if (state.active !== undefined) queryParams.active = state.active;
        if (state.usageType) queryParams.usageType = state.usageType;
        if (state.usagePurpose) queryParams.usagePurpose = state.usagePurpose;

        // Navigate với replaceUrl để không thêm vào history
        this.router.navigate([], {
            queryParams,
            queryParamsHandling: 'replace',
            replaceUrl: true
        });
    }
}

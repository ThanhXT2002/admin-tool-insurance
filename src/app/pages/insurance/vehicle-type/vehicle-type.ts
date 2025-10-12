import {
    Component,
    inject,
    OnInit,
    OnDestroy,
    ViewChild,
    effect,
    signal,
    ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Select } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { Toolbar } from 'primeng/toolbar';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { RefreshService } from '@/pages/service/refresh.service';
import { VehicleTypeStore } from '@/store/vehicle-type/vehicle-type.store';
import {
    VehicleType as VehicleTypeModel,
    UsageType,
    UsagePurpose
} from '@/interfaces/vehicle-type.interface';

/**
 * Component quản lý danh sách loại phương tiện
 * Cung cấp giao diện CRUD, tìm kiếm, lọc và pagination
 */
@Component({
    selector: 'app-vehicle-type',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        CommonModule,
        FormsModule,
        Select,
        Popover,
        Toolbar
    ],
    providers: [ConfirmationService],
    templateUrl: './vehicle-type.html',
    styleUrl: './vehicle-type.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleType implements OnInit, OnDestroy {
    vehicleTypeStore = inject(VehicleTypeStore);
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    // Sử dụng trực tiếp các signal của store để UI luôn đồng bộ
    items = this.vehicleTypeStore.rows;
    totalRecords = 0;
    loading = false;
    selectedItems!: VehicleTypeModel[] | null;

    page = 1;
    limit = 10;
    first = 0; // Index của record đầu tiên cho PrimeNG paginator
    active: boolean | undefined = undefined;
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    private destroy$ = new Subject<void>();
    private skipLazyLoads = 0;
    private searchTimeout: any;
    // Prevent overlapping API calls
    private _isLoadingInFlight = false;
    // Khi true, applyParams sẽ không gọi store.load vì handler đã gọi trước đó
    private _suppressApplyParamsLoad = false;
    // Đặt true sau khi hydrate/load ban đầu hoàn tất để bỏ qua các sự kiện ngModelChange sinh ra trong khởi tạo
    private _initialized = false;

    private _totalEffect = effect(() => {
        const t = this.vehicleTypeStore.total();
        this.totalRecords = t;
    });

    private _loadingEffect = effect(() => {
        const items = this.vehicleTypeStore.rows();
        // Nếu có data và đang loading, tắt loading
        if (items.length > 0 && this.loading) {
            this.loading = false;
        }
    });

    private _errorEffect = effect(() => {
        const error = this.vehicleTypeStore.error();
        if (error) {
            // Tắt loading khi có error
            this.loading = false;
            this._isLoadingInFlight = false;

            // Hiển thị error message
            let errorMessage = 'Có lỗi xảy ra';

            // Lấy message từ API response
            if (error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: errorMessage,
                life: 5000
            });
        }
    });

    activeOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    usageTypeOptions = [
        { name: 'Tất cả loại sử dụng', code: undefined },
        { name: 'Ô tô kinh doanh vận tải', code: 'OTOKKDVT' },
        { name: 'Ô tô không kinh doanh vận tải', code: 'OTOKDVT' },
        { name: 'Xe máy', code: 'XEMAY' },
        { name: 'Vỏ chai xe ô tô', code: 'VCXOTO' }
    ];

    usagePurposeOptions = [
        { name: 'Tất cả mục đích sử dụng', code: undefined },
        { name: 'Xe cá nhân', code: 'XCN' },
        { name: 'Xe chở hàng', code: 'XCH' },
        { name: 'Xe cá nhân và chở hàng', code: 'XCN_CH' }
    ];

    selectedActive = this.activeOptions[0];
    selectedUsageType = this.usageTypeOptions[0];
    selectedUsagePurpose = this.usagePurposeOptions[0];

    ngOnInit() {
        // Hydrate from query params and prevent duplicate load
        this._suppressApplyParamsLoad = true;
        const parsed =
            this.vehicleTypeStore.hydrateFromQueryParams(
                this.route.snapshot.queryParams as any
            ) || {};

        // Update local UI fields from parsed values
        const storeState = this.vehicleTypeStore.snapshot();
        const hasUrlParams = Object.keys(parsed).length > 0;
        const cacheMatched = (parsed as any)?._cacheMatched;
        const hasCachedData = (parsed as any)?._hasCachedData;

        if (!hasUrlParams && hasCachedData) {
            // Sử dụng dữ liệu cache đã có - không cần load thêm
            this.syncUIFromStore(storeState);
        } else if (hasUrlParams && cacheMatched) {
            // URL params match với cache - sử dụng cache
            this.syncUIFromStore(storeState);
        } else {
            // Cần tải dữ liệu mới
            this.syncUIFromStore(storeState);
        }

        // Đồng bộ first index với page cho PrimeNG paginator
        this.first = (this.page - 1) * this.limit;

        // Bỏ qua sự kiện onLazyLoad đầu tiên của PrimeNG
        this.skipLazyLoads += 1;

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                if (!this._suppressApplyParamsLoad) {
                    this.applyParams(params);
                }
                this._suppressApplyParamsLoad = false;
            });

        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.reloadCurrentData();
            });

        // Nếu store đã load data thì không cần gọi API thêm
        if (!hasUrlParams && !hasCachedData) {
            this.loadData();
        } else if (hasUrlParams && !cacheMatched) {
            this.loadData();
        } else {
            this.loading = false;
        }

        // cho phép các handler thay đổi select chỉ chạy sau khi hydrate/tải ban đầu hoàn tất
        this._initialized = true;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
        // dừng các effect của signal được tạo dưới dạng trường lớp để tránh rò rỉ bộ nhớ
        try {
            this._totalEffect.destroy();
            this._loadingEffect.destroy();
            this._errorEffect.destroy();
        } catch (_) {}
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

    triggerSearch(keyword: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (!this._initialized) return;

            this.currentKeyword = keyword.trim() || undefined;
            this.page = 1;
            this.first = 0;

            // Sync URL without triggering duplicate load
            this._suppressApplyParamsLoad = true;

            const params: any = this.buildFilterParams(undefined, {
                page: this.page,
                limit: this.limit,
                keyword: this.currentKeyword
            });

            this.applyFiltersAndNavigate(params);
        }, 350);
    }

    loadData(keyword?: string) {
        // avoid duplicate concurrent loads
        if (this._isLoadingInFlight) return;

        this.loading = true;
        this._isLoadingInFlight = true;

        const params: any = this.buildFilterParams(undefined, {
            page: this.page,
            limit: this.limit,
            keyword: keyword ?? this.currentKeyword
        });

        // gọi store để tải dữ liệu; store sẽ cập nhật các signal được template sử dụng
        this.vehicleTypeStore
            .load(params, { skipSync: !this._initialized })
            .finally(() => {
                this.loading = false;
                this._isLoadingInFlight = false;
            });
    }

    onLazyLoad(event: any) {
        if (this.skipLazyLoads > 0) {
            this.skipLazyLoads--;
            return;
        }

        // Sự kiện lazy của PrimeNG chứa các trường first và rows
        const first = Number(event.first) || 0;
        const rows = Number(event.rows) || this.limit;
        const newPage = Math.floor(first / rows) + 1;

        this.first = first;
        this.page = newPage;
        this.limit = rows;
        this.loading = true;
        this.loadData(this.currentKeyword);
    }

    openNew() {
        this.router.navigate(['/insurance/vehicle-type/create']);
    }

    editItem(id: number) {
        this.router.navigate(['/insurance/vehicle-type/update', id]);
    }

    // Toggle active một item
    async toggleActiveItem(id: number) {
        try {
            // Tìm item hiện tại để lấy trạng thái active
            const currentItem = this.vehicleTypeStore
                .rows()
                .find((item) => item.id === id);
            if (currentItem) {
                const newActiveStatus = !currentItem.active;
                await this.vehicleTypeStore.toggleMultiple(
                    [id],
                    newActiveStatus
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đã ${newActiveStatus ? 'kích hoạt' : 'vô hiệu hóa'} loại phương tiện`
                });
            }
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err.message || 'Có lỗi xảy ra khi thay đổi trạng thái'
            });
        }
    }

    // Batch actions từ popover: dùng selectedItems
    async toggleActiveSelected(active: boolean, op?: any) {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        try {
            await this.vehicleTypeStore.toggleMultiple(ids, active);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã ${active ? 'kích hoạt' : 'vô hiệu hóa'} ${ids.length} loại phương tiện`
            });
            this.clearSelectionAndDt();
            op?.hide();
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err.message || 'Có lỗi xảy ra khi thay đổi trạng thái'
            });
        }
    }

    deleteItem(item: VehicleTypeModel) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa loại phương tiện này?',
            header: 'Xóa loại phương tiện',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: async () => {
                try {
                    await this.vehicleTypeStore.delete(item.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Xóa loại phương tiện thành công'
                    });
                    this.clearSelectionAndDt();
                } catch (err: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: err.message || 'Có lỗi xảy ra khi xóa'
                    });
                }
            },
            reject: () =>
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác'
                })
        });
    }

    changeStatus() {
        if (!this._initialized) return;

        // Build load params from current selections and keyword
        const params: any = {
            page: 1,
            limit: this.limit,
            keyword: this.currentKeyword ?? undefined,
            active: this.selectedActive?.code,
            usageType: this.selectedUsageType?.code,
            usagePurpose: this.selectedUsagePurpose?.code
        };

        // Load data với store cache logic sẽ tự xử lý duplicate calls
        this.loading = true;
        this._isLoadingInFlight = true;

        this.vehicleTypeStore.load(params).finally(() => {
            this.loading = false;
            this._isLoadingInFlight = false;
        });
    }

    // Shared: perform store.load then navigate to reflect params in URL
    private applyFiltersAndNavigate(params: any) {
        this.vehicleTypeStore.load(params).finally(() => {
            // Update URL to reflect current filters
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: params.page || 1,
                    limit: params.limit || 10,
                    ...(params.keyword && { keyword: params.keyword }),
                    ...(params.active !== undefined && {
                        active: params.active
                    }),
                    ...(params.usageType && { usageType: params.usageType }),
                    ...(params.usagePurpose && {
                        usagePurpose: params.usagePurpose
                    })
                },
                queryParamsHandling: 'merge'
            });

            this.page = params.page || 1;
            this.limit = params.limit || 10;
            this.first = (this.page - 1) * this.limit;
        });
    }

    deleteMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        this.confirmationService.confirm({
            message: `Bạn có chắc muốn xóa ${this.selectedItems.length} loại phương tiện đã chọn?`,
            header: 'Xóa nhiều loại phương tiện',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: async () => {
                const ids = this.idsFromSelected();
                try {
                    await this.vehicleTypeStore.deleteMultiple(ids);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: `Xóa thành công ${ids.length} loại phương tiện`
                    });
                    this.clearSelectionAndDt();
                } catch (err: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: err.message || 'Có lỗi xảy ra khi xóa'
                    });
                }
            }
        });
    }

    /**
     * Sync UI state from store snapshot
     */
    private syncUIFromStore(storeState: any) {
        this.page = storeState.page || 1;
        this.limit = storeState.limit || 10;
        this.currentKeyword = storeState.keyword;

        // Sync select options
        this.selectedActive =
            this.activeOptions.find((opt) => opt.code === storeState.active) ||
            this.activeOptions[0];
        this.selectedUsageType =
            this.usageTypeOptions.find(
                (opt) => opt.code === storeState.usageType
            ) || this.usageTypeOptions[0];
        this.selectedUsagePurpose =
            this.usagePurposeOptions.find(
                (opt) => opt.code === storeState.usagePurpose
            ) || this.usagePurposeOptions[0];
    }

    private applyParams(params: any, options?: { skipSync?: boolean }) {
        // Parse và sync params với local state
        const newPage = Number(params.page) || 1;
        const newLimit = Number(params.limit) || 10;
        const newKeyword = params.keyword || undefined;
        const newActive =
            params.active !== undefined ? params.active === 'true' : undefined;
        const newUsageType = params.usageType || undefined;
        const newUsagePurpose = params.usagePurpose || undefined;

        // Check if any values changed
        const changed =
            this.page !== newPage ||
            this.limit !== newLimit ||
            this.currentKeyword !== newKeyword ||
            this.selectedActive?.code !== newActive ||
            this.selectedUsageType?.code !== newUsageType ||
            this.selectedUsagePurpose?.code !== newUsagePurpose;

        if (changed) {
            // Update local state
            this.page = newPage;
            this.limit = newLimit;
            this.currentKeyword = newKeyword;
            this.first = (this.page - 1) * this.limit;

            // Sync select options
            this.selectedActive =
                this.activeOptions.find((opt) => opt.code === newActive) ||
                this.activeOptions[0];
            this.selectedUsageType =
                this.usageTypeOptions.find(
                    (opt) => opt.code === newUsageType
                ) || this.usageTypeOptions[0];
            this.selectedUsagePurpose =
                this.usagePurposeOptions.find(
                    (opt) => opt.code === newUsagePurpose
                ) || this.usagePurposeOptions[0];

            // Load data if needed
            if (!this._suppressApplyParamsLoad) {
                this.vehicleTypeStore.load(
                    {
                        page: this.page,
                        limit: this.limit,
                        keyword: this.currentKeyword,
                        active: newActive,
                        usageType: newUsageType,
                        usagePurpose: newUsagePurpose
                    },
                    { skipSync: options?.skipSync }
                );
            }
        }
    }

    // --- Các hàm trợ giúp để giảm trùng lặp cho các thao tác chọn và tải lại ---
    private idsFromSelected(): number[] {
        return this.selectedItems?.map((item) => item.id) || [];
    }

    private clearSelectionAndDt(): void {
        this.selectedItems = null;
        if (this.dt) {
            this.dt.clear();
        }
        this.reloadCurrentData();
    }

    private reloadCurrentData(): void {
        this.loadData(this.currentKeyword);
    }

    // Đặt lại phân trang về mặc định và xóa tất cả bộ lọc khác
    resetPagination() {
        this.page = 1;
        this.limit = 10;
        this.first = 0;
        this.currentKeyword = undefined;
        this.selectedActive = this.activeOptions[0];
        this.selectedUsageType = this.usageTypeOptions[0];
        this.selectedUsagePurpose = this.usagePurposeOptions[0];

        // Clear selections
        this.selectedItems = null;

        // Navigate with clean params
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { page: 1, limit: 10 },
            replaceUrl: true
        });

        // Load fresh data
        this.vehicleTypeStore.load({ page: 1, limit: 10 });
    }

    /**
     * Xây dựng đối tượng params dùng để tải dữ liệu và điều hướng URL.
     */
    private buildFilterParams(categoryId?: number, overrides?: any) {
        return {
            page: overrides?.page ?? this.page,
            limit: overrides?.limit ?? this.limit,
            keyword: overrides?.keyword ?? this.currentKeyword,
            active: overrides?.active ?? this.selectedActive?.code,
            usageType: overrides?.usageType ?? this.selectedUsageType?.code,
            usagePurpose:
                overrides?.usagePurpose ?? this.selectedUsagePurpose?.code,
            ...(categoryId && { categoryId })
        };
    }

    getActiveStatusLabel(active: boolean): string {
        return active ? 'Hoạt động' : 'Không hoạt động';
    }

    getBgColorForActive(active: boolean): string {
        return active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    }

    getUsageTypeLabel(value: UsageType): string {
        return (
            this.usageTypeOptions.find((opt) => opt.code === value)?.name ||
            value
        );
    }

    getUsagePurposeLabel(value: UsagePurpose): string {
        return (
            this.usagePurposeOptions.find((opt) => opt.code === value)?.name ||
            value
        );
    }
}

import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject,
    signal,
    effect
} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductStore } from '@/store/product/product.store';
import { Product } from '@/interfaces/product.interface';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-products',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        FormsModule,
        ToggleSwitch,
        Select,
        CommonModule
    ],
    providers: [ConfirmationService],
    templateUrl: './products.html',
    styleUrl: './products.scss'
})
export class Products implements OnInit, OnDestroy {
    productStore = inject(ProductStore);
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    // Sử dụng trực tiếp các signal của store để UI luôn đồng bộ
    items = this.productStore.rows;
    totalRecords = 0;
    loading = false;
    selectedItems!: Product[] | null;

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
        const t = this.productStore.total();
        this.totalRecords = t;
    });

    private _loadingEffect = effect(() => {
        const items = this.productStore.rows();
        // Nếu có data và đang loading, tắt loading
        if (items.length > 0 && this.loading) {
            this.loading = false;
        }
    });

    // selectedItem: Product | null = null;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    selectedStatus = this.statusOptions[0];

    ngOnInit() {
        // Hydrate from query params and prevent duplicate load
        this._suppressApplyParamsLoad = true;
        const parsed =
            this.productStore.hydrateFromQueryParams(
                this.route.snapshot.queryParams as any
            ) || {};

        // Update local UI fields from parsed values
        const storeState = this.productStore.snapshot();
        const hasUrlParams = Object.keys(parsed).length > 0;
        const cacheMatched = (parsed as any)?._cacheMatched;
        const hasCachedData = (parsed as any)?._hasCachedData;

        if (!hasUrlParams && hasCachedData) {
            // Không có URL params nhưng có cache data
            // Sử dụng cache data (store đã tự sync URL)
            this.page = storeState.page || 1;
            this.limit = storeState.limit || 10;
            this.currentKeyword =
                storeState.currentFilter?.keyword ?? undefined;
            this.active = storeState.currentFilter?.active ?? undefined;
        } else if (hasUrlParams && cacheMatched) {
            // Có URL params và cache khớp - sử dụng cache data
            this.page = storeState.page || 1;
            this.limit = storeState.limit || 10;
            this.currentKeyword =
                storeState.currentFilter?.keyword ?? undefined;
            this.active = storeState.currentFilter?.active ?? undefined;
        } else {
            // Có URL params và cache không khớp hoặc không có cache - store đã tự load data
            this.page = parsed.page ?? 1;
            this.limit = parsed.limit ?? 10;
            this.currentKeyword = parsed.keyword ?? undefined;
            this.active = parsed.active ?? undefined;
            // Hiển thị loading vì store đang gọi API
            this.loading = true;
        }

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        // Đồng bộ first index với page cho PrimeNG paginator
        this.syncFirstWithPage();

        // Skip first lazy load events from PrimeNG table initialization
        this.skipLazyLoads += 1;

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.applyParams(params);
            });

        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.reloadCurrentData();
            });

        // hydrateFromQueryParams đã tự động load data khi cần
        // Không cần kiểm tra thêm

        // Allow select change handlers to run after initial hydrate/load
        this._initialized = true;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
        // dừng các effect của signal được tạo dưới dạng trường lớp để tránh rò rỉ bộ nhớ
        try {
            if (typeof (this as any)._totalEffect === 'function')
                (this as any)._totalEffect();
            if (typeof (this as any)._loadingEffect === 'function')
                (this as any)._loadingEffect();
        } catch (_) {}
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

    triggerSearch(keyword: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const currentParams = this.route.snapshot.queryParams;
            const currentKeyword = currentParams['keyword'] || '';
            const currentPage = Number(currentParams['page']) || 1;

            const shouldResetPage = currentKeyword !== keyword;
            const targetPage = shouldResetPage ? 1 : currentPage;

            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: targetPage,
                    limit: this.limit,
                    keyword: keyword || null,
                    active: this.active !== undefined ? this.active : null
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
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

        // Call store to load data; store will update signals used by template
        this.productStore
            .load(params, { skipSync: !this._initialized })
            .finally(() => {
                this._isLoadingInFlight = false;
                this.loading = false;
            });
    }

    onLazyLoad(event: any) {
        if (this.skipLazyLoads > 0) {
            this.skipLazyLoads -= 1;
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
        this.router.navigate(['/insurance/product/create']);
    }

    editItem(id: number) {
        this.router.navigate(['/insurance/product/update', id]);
    }

    changeStatus() {
        if (!this._initialized) return;

        // Đồng bộ this.active với selectedStatus.code
        this.active = this.selectedStatus?.code;

        // Build load params from current selections and keyword
        const params: any = {
            page: 1,
            limit: this.limit,
            keyword: this.currentKeyword ?? undefined,
            active: this.selectedStatus?.code
        };

        // Load data với store cache logic sẽ tự xử lý duplicate calls
        this.loading = true;
        this._isLoadingInFlight = true;

        this.productStore.load(params).finally(() => {
            this.loading = false;
            this._isLoadingInFlight = false;
        });
    }

    deleteItem(item: Product) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa sản phẩm này?',
            header: 'Xóa sản phẩm',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: async () => {
                try {
                    await this.productStore.delete(item.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Xóa sản phẩm thành công'
                    });
                } catch (err: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: err?.message || 'Xóa thất bại'
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

    deleteMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa những sản phẩm đã chọn?',
            header: 'Xóa nhiều sản phẩm',
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: () => {
                const ids = this.selectedItems!.map((i) => i.id);
                this.productStore.deleteMultiple(ids);
                this.clearSelectionAndDt();
            },
            reject: () =>
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác xóa'
                })
        });
    }

    async activeMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);
        try {
            await this.productStore.batchActive(ids, true);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Kích hoạt sản phẩm thành công'
            });
            this.clearSelectionAndDt();
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Kích hoạt thất bại'
            });
        }
    }

    async inactiveMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);
        try {
            await this.productStore.batchActive(ids, false);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Vô hiệu hóa sản phẩm thành công'
            });
            this.clearSelectionAndDt();
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Vô hiệu hóa thất bại'
            });
        }
    }

    async toggleChangeStatus(item: Product) {
        if (!item) return;
        // Toggle 'active' status (keep existing behavior)
        const newStatus = !item.active;
        try {
            await this.productStore.batchActive([item.id], newStatus);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} sản phẩm thành công`
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Cập nhật trạng thái thất bại'
            });
        }
    }

    // New: quick toggle for isSaleOnline flag (separate from active)
    async toggleIsSaleOnline(item: Product) {
        if (!item) return;
        const newVal = !item.isSaleOnline;
        try {
            await this.productStore.updateIsSaleOnline(item.id, newVal);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Cập nhật bán online thành công`
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Cập nhật bán online thất bại'
            });
        }
    }

    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;
        const fallback = 'assets/images/no-img.webp';
        if (target.src && !target.src.endsWith(fallback)) target.src = fallback;
    }

    // --- Helper methods to reduce duplication for selection and reload operations ---

    /**
     * Đồng bộ first index với page number cho PrimeNG paginator
     */
    private syncFirstWithPage(): void {
        this.first = (this.page - 1) * this.limit;
    }

    private reloadCurrentData(): void {
        this.loadData(this.currentKeyword);
    }

    // Shared: perform store.load then navigate to reflect params in URL
    private applyFiltersAndNavigate(params: any) {
        this.loading = true;
        this._isLoadingInFlight = true;

        this.productStore.load(params).finally(() => {
            this._isLoadingInFlight = false;
        });
    }

    /**
     * Build params object used for data loading and URL navigation.
     * Accepts optional overrides to set page/limit/keyword
     */
    private buildFilterParams(categoryId?: number, overrides?: any) {
        const params: any = {
            page: this.page,
            limit: this.limit,
            keyword: this.currentKeyword || undefined,
            active: this.selectedStatus?.code
        };

        if (overrides) {
            Object.assign(params, overrides);
        }

        // Remove undefined values
        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        return params;
    }

    /**
     * Áp dụng các tham số từ query params vào state của component.
     * - Cập nhật page/limit/keyword và các select UI (status, ProductType, highlighted, featured)
     * - Nếu một handler đã gọi load trước đó (_suppressApplyParamsLoad=true) thì sẽ bỏ qua
     * - Nếu có thay đổi cần tải dữ liệu sẽ gọi this.productStore.load với tùy chọn skipSync khi được yêu cầu
     */
    private applyParams(params: any, options?: { skipSync?: boolean }) {
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        // Parse incoming active param (boolean) from query params
        let newActive: boolean | undefined = undefined;
        if (params['active'] === 'true') newActive = true;
        else if (params['active'] === 'false') newActive = false;

        const newCategoryId = params['categoryId']
            ? Number(params['categoryId'])
            : undefined;
        const newProductType = params['ProductType'] || undefined;
        const newIsFeatured =
            params['isFeatured'] === 'true'
                ? true
                : params['isFeatured'] === 'false'
                  ? false
                  : undefined;
        const newIsHighlighted =
            params['isHighlighted'] === 'true'
                ? true
                : params['isHighlighted'] === 'false'
                  ? false
                  : undefined;

        const pageChanged = this.page !== newPage;
        const limitChanged = this.limit !== newLimit;
        const keywordChanged = this.currentKeyword !== newKeyword;
        const statusChanged = this.selectedStatus?.code !== newActive;

        this.page = newPage;
        this.limit = newLimit;
        this.currentKeyword = newKeyword;
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === newActive) ||
            this.statusOptions[0];
        // keep legacy this.active in sync so other handlers (search/navigation) don't re-add stale param
        this.active = this.selectedStatus?.code;

        // Đồng bộ first index với page cho PrimeNG paginator
        this.syncFirstWithPage();

        // Nếu một handler đã trigger load và đặt flag suppress, thì không tải lại ở đây
        if (this._suppressApplyParamsLoad) {
            this._suppressApplyParamsLoad = false;
            return;
        }

        // Nếu có thay đổi cần tải lại dữ liệu thì gọi store.load và tránh trùng với lazyLoad của PrimeNG
        if (
            pageChanged ||
            limitChanged ||
            keywordChanged ||
            statusChanged ||
            newCategoryId !== undefined ||
            newProductType !== undefined ||
            newIsFeatured !== undefined ||
            newIsHighlighted !== undefined
        ) {
            // bỏ qua sự kiện lazy load tiếp theo mà PrimeNG có thể phát ra
            this.skipLazyLoads += 1;

            const paramsToLoad: any = {
                page: this.page,
                limit: this.limit,
                keyword: this.currentKeyword,
                active: this.selectedStatus?.code,
                categoryId: newCategoryId,
                ProductType: newProductType,
                isFeatured: newIsFeatured,
                isHighlighted: newIsHighlighted
            };

            // Gọi store để fetch dữ liệu; truyền skipSync nếu cần để tránh điều hướng URL khi đang hydrate
            console.log(
                '🔥 applyParams calling productStore.load with:',
                paramsToLoad
            );
            this.productStore.load(paramsToLoad, {
                skipSync: !!options?.skipSync
            });
        }
    }

    private clearSelectionAndDt(): void {
        this.selectedItems = null;
        try {
            if (this.dt) {
                (this.dt as any).selection = null;
                (this.dt as any).selectionKeys = {};
            }
        } catch (_) {}
    }
}

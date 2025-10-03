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
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PostCategory } from '@/interfaces/post-category.interface';
import { PostStore } from '@/store/post/post.store';
import { Post } from '@/interfaces/post.interface';
import { Popover } from 'primeng/popover';
import { Toolbar } from 'primeng/toolbar';

@Component({
    selector: 'app-posts',
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
    templateUrl: './posts.html',
    styleUrl: './posts.scss'
})
export class Posts implements OnInit, OnDestroy {
    postStore = inject(PostStore);
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    // Sử dụng trực tiếp các signal của store để UI luôn đồng bộ
    items = this.postStore.rows;
    totalRecords = 0;
    loading = false;
    selectedItems!: Post[] | null;

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
        const t = this.postStore.total();
        this.totalRecords = t;
    });

    private _loadingEffect = effect(() => {
        const items = this.postStore.rows();
        // Nếu có data và đang loading, tắt loading
        if (items.length > 0 && this.loading) {
            this.loading = false;
        }
    });

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: 'PUBLISHED' },
        { name: 'Đã lưu trữ', code: 'ARCHIVED' },
        { name: 'Bản nháp', code: 'DRAFT' }
    ];

    postTypeOptions = [
        { name: 'Tất cả loại bài viết', code: undefined },
        { name: 'Bài viết', code: 'ARTICLE' },
        { name: 'Hướng dẫn', code: 'GUIDE' },
        { name: 'Tin tức', code: 'NEWS' },
        { name: 'Sản phẩm', code: 'PRODUCT' },
        { name: 'Câu hỏi thường gặp', code: 'FAQ' }
    ];

    highlightedOptions = [
        { name: 'Lọc theo nổi bật', code: undefined },
        { name: 'Nổi bật', code: true },
        { name: 'Không nổi bật', code: false }
    ];

    featuredOptions = [
        { name: 'Hiển thị ở home page', code: undefined },
        { name: 'Được hiển thị', code: true },
        { name: 'Không được hiển thị', code: false }
    ];

    selectedStatus = this.statusOptions[0];
    selectedPostType = this.postTypeOptions[0];
    selectedIsHighlighted = this.highlightedOptions[0];
    selectedIsFeatured = this.featuredOptions[0];

    ngOnInit() {
        // Hydrate from query params and prevent duplicate load
        this._suppressApplyParamsLoad = true;
        const parsed =
            this.postStore.hydrateFromQueryParams(
                this.route.snapshot.queryParams as any
            ) || {};

        // Update local UI fields from parsed values
        const storeState = this.postStore.snapshot();
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
            this.selectedStatus =
                this.statusOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.status
                ) || this.statusOptions[0];
            this.selectedPostType =
                this.postTypeOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.postType
                ) || this.postTypeOptions[0];
            this.selectedIsHighlighted =
                this.highlightedOptions.find(
                    (opt) =>
                        opt.code === storeState.currentFilter?.isHighlighted
                ) || this.highlightedOptions[0];
            this.selectedIsFeatured =
                this.featuredOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.isFeatured
                ) || this.featuredOptions[0];
        } else if (hasUrlParams && cacheMatched) {
            // Có URL params và cache khớp - sử dụng cache data
            this.page = storeState.page || 1;
            this.limit = storeState.limit || 10;
            this.currentKeyword =
                storeState.currentFilter?.keyword ?? undefined;
            this.selectedStatus =
                this.statusOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.status
                ) || this.statusOptions[0];
            this.selectedPostType =
                this.postTypeOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.postType
                ) || this.postTypeOptions[0];
            this.selectedIsHighlighted =
                this.highlightedOptions.find(
                    (opt) =>
                        opt.code === storeState.currentFilter?.isHighlighted
                ) || this.highlightedOptions[0];
            this.selectedIsFeatured =
                this.featuredOptions.find(
                    (opt) => opt.code === storeState.currentFilter?.isFeatured
                ) || this.featuredOptions[0];
        } else {
            // Có URL params và cache không khớp hoặc không có cache - store đã tự load data
            this.page = parsed.page ?? 1;
            this.limit = parsed.limit ?? 10;
            this.currentKeyword = parsed.keyword ?? undefined;
            this.selectedStatus =
                this.statusOptions.find((opt) => opt.code === parsed.status) ||
                this.statusOptions[0];
            this.selectedPostType =
                this.postTypeOptions.find(
                    (opt) => opt.code === parsed.postType
                ) || this.postTypeOptions[0];
            this.selectedIsHighlighted =
                this.highlightedOptions.find(
                    (opt) => opt.code === parsed.isHighlighted
                ) || this.highlightedOptions[0];
            this.selectedIsFeatured =
                this.featuredOptions.find(
                    (opt) => opt.code === parsed.isFeatured
                ) || this.featuredOptions[0];
        }

        // Đồng bộ first index với page cho PrimeNG paginator
        this.first = (this.page - 1) * this.limit;

        // Bỏ qua sự kiện onLazyLoad đầu tiên của PrimeNG có thể được phát trong khi khởi tạo bảng
        // và ghi đè giá trị page từ query params. Thông thường một lần bỏ qua là đủ,
        // tăng số lần nếu bạn thấy nhiều sự kiện không mong muốn.
        this.skipLazyLoads += 1;

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                // Trong lần subscribe ban đầu, component có thể chưa được khởi tạo hoàn toàn
                // trong trường hợp đó, tránh để applyParams kích hoạt đồng bộ router
                // vì điều đó sẽ ghi đè URL đã dán. Nếu đã khởi tạo thì cho phép đồng bộ.
                this.applyParams(params, { skipSync: !this._initialized });
            });

        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const currentParams = this.route.snapshot.queryParams;
                const keyword = currentParams['keyword'] || undefined;
                this.loadData(keyword);
            });

        // Nếu store đã load data (cacheMatched hoặc đã có params) thì không cần gọi API thêm
        // Chỉ gọi API khi: không có URL params + không có cache data phù hợp
        if (!hasUrlParams && !hasCachedData) {
            // Không có URL params và không có cache data -> load trang đầu tiên
            this.loadData(this.currentKeyword);
        } else if (hasUrlParams && !cacheMatched) {
            // Có URL params nhưng cache không match -> store đã tự load trong hydrateFromQueryParams
            this.loading = true; // Hiển thị loading vì store đang gọi API
        } else {
            // Có cache data phù hợp -> không cần gọi API
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

            // giữ nguyên các lựa chọn bộ lọc khác khi tìm kiếm
            const postType = this.selectedPostType?.code ?? null;
            const isHighlighted =
                this.selectedIsHighlighted?.code === undefined
                    ? null
                    : String(this.selectedIsHighlighted?.code);
            const isFeatured =
                this.selectedIsFeatured?.code === undefined
                    ? null
                    : String(this.selectedIsFeatured?.code);

            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: targetPage,
                    limit: this.limit,
                    keyword: keyword || null,
                    active: this.active !== undefined ? this.active : null,
                    postType: postType,
                    isHighlighted: isHighlighted,
                    isFeatured: isFeatured
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

        // gọi store để tải dữ liệu; store sẽ cập nhật các signal được template sử dụng
        this.postStore
            .load(params, { skipSync: !this._initialized })
            .finally(() => {
                this.loading = false;
                this._isLoadingInFlight = false;
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
        this.router.navigate(['/insurance/post/create']);
    }

    editItem(id: number) {
        this.router.navigate(['/insurance/posts/update', id]);
    }

    // Xuất bản một bài viết
    async publishItem(id: number) {
        try {
            await this.postStore.publish(id);
            this.messageService.add({
                severity: 'success',
                summary: 'Đã xuất bản',
                detail: 'Xuất bản thành công'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể xuất bản'
            });
        }
    }

    // Gỡ xuất bản (về bản nháp)
    async unpublishItem(id: number) {
        try {
            await this.postStore.unpublish(id);
            this.messageService.add({
                severity: 'success',
                summary: 'Đã gỡ xuất bản',
                detail: 'Thao tác thành công'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể gỡ xuất bản'
            });
        }
    }

    // Lưu trữ một bài viết
    async archiveItem(id: number) {
        try {
            await this.postStore.archive(id);
            this.messageService.add({
                severity: 'success',
                summary: 'Đã lưu trữ',
                detail: 'Lưu trữ thành công'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể lưu trữ'
            });
        }
    }

    // Batch actions từ popover: dùng selectedItems
    async publishSelected(op?: any) {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        try {
            await this.postStore.publishMultiple(ids);
            // clear selection and table internals, reload
            this.clearSelectionAndDt();
            op?.hide?.();
            this.reloadCurrentData();
            this.messageService.add({
                severity: 'success',
                summary: 'Đã xuất bản',
                detail: 'Xuất bản các bài viết thành công'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể xuất bản'
            });
        }
    }

    async unpublishSelected(op?: any) {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        try {
            await this.postStore.unpublishMultiple(ids);
            this.clearSelectionAndDt();
            op?.hide?.();
            this.reloadCurrentData();
            this.messageService.add({
                severity: 'success',
                summary: 'Đã gỡ xuất bản',
                detail: 'Hoàn tất'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể gỡ xuất bản'
            });
        }
    }

    async archiveSelected(op?: any) {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        try {
            await this.postStore.archiveMultiple(ids);
            this.clearSelectionAndDt();
            op?.hide?.();
            this.reloadCurrentData();
            this.messageService.add({
                severity: 'success',
                summary: 'Đã lưu trữ',
                detail: 'Hoàn tất'
            });
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: err?.message || 'Không thể lưu trữ'
            });
        }
    }

    deleteItem(item: Post) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa bài viết này?',
            header: 'Xóa bài viết',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: async () => {
                try {
                    await this.postStore.delete(item.id);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Đã xóa',
                        detail: 'Xóa bài viết thành công'
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

    changeStatus() {
        if (!this._initialized) return;

        // Build load params from current selections and keyword
        const params: any = {
            page: 1,
            limit: this.limit,
            keyword: this.currentKeyword ?? undefined,
            status: this.selectedStatus?.code,
            postType: this.selectedPostType?.code,
            isFeatured:
                this.selectedIsFeatured?.code === undefined
                    ? undefined
                    : Boolean(this.selectedIsFeatured?.code),
            isHighlighted:
                this.selectedIsHighlighted?.code === undefined
                    ? undefined
                    : Boolean(this.selectedIsHighlighted?.code)
        };

        // Load data với store cache logic sẽ tự xử lý duplicate calls
        this.loading = true;
        this._isLoadingInFlight = true;

        this.postStore.load(params).finally(() => {
            this.loading = false;
            this._isLoadingInFlight = false;
        });
    }

    // Lọc theo category khi người dùng click vào tên category trong danh sách
    filterByCategory(categoryId?: number) {
        if (!this._initialized) {
            // nếu component chưa sẵn sàng, chặn hành động
            return;
        }

        const params: any = this.buildFilterParams(categoryId, {
            page: 1,
            limit: this.limit,
            keyword: this.currentKeyword ?? undefined
        });

        // ngăn subscription của route kích hoạt load lần thứ hai
        this._suppressApplyParamsLoad = true;

        this.applyFiltersAndNavigate(params);
    }

    // Shared: perform store.load then navigate to reflect params in URL (keeps categoryId when provided)
    private applyFiltersAndNavigate(params: any) {
        this.postStore.load(params).finally(() => {
            const status = params.status ?? null;
            const postType = params.postType ?? null;
            const isHighlighted =
                params.isHighlighted === undefined
                    ? null
                    : String(params.isHighlighted);
            const isFeatured =
                params.isFeatured === undefined
                    ? null
                    : String(params.isFeatured);

            const queryParams: any = {
                page: 1,
                limit: this.limit,
                status,
                postType,
                isHighlighted,
                isFeatured,
                keyword: params.keyword ?? null
            };

            if (params.categoryId !== undefined) {
                queryParams.categoryId = params.categoryId ?? null;
            }

            this.router.navigate([], {
                relativeTo: this.route,
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
        });
    }

    deleteMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa những danh mục đã chọn?',
            header: 'Xóa nhiều danh mục',
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: () => {
                const ids = this.selectedItems!.map((i) => i.id);
                this.postStore.deleteMultiple(ids);
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

    activeMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        this.clearSelectionAndDt();
    }

    inactiveMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.idsFromSelected();
        this.clearSelectionAndDt();
    }

    toggleChangeStatus(item: PostCategory) {
        if (!item) return;
        const newStatus = !item.active;
    }

    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;
        const fallback = 'assets/images/no-img.webp';
        if (target.src && !target.src.endsWith(fallback)) target.src = fallback;
    }

    /**
     * Áp dụng các tham số từ query params vào state của component.
     * - Cập nhật page/limit/keyword và các select UI (status, postType, highlighted, featured)
     * - Nếu một handler đã gọi load trước đó (_suppressApplyParamsLoad=true) thì sẽ bỏ qua
     * - Nếu có thay đổi cần tải dữ liệu sẽ gọi this.postStore.load với tùy chọn skipSync khi được yêu cầu
     */
    private applyParams(params: any, options?: { skipSync?: boolean }) {
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        let newStatus: string | undefined = undefined;
        if (params['status']) newStatus = params['status'];

        const newCategoryId = params['categoryId']
            ? Number(params['categoryId'])
            : undefined;
        const newPostType = params['postType'] || undefined;
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
        const statusChanged = this.selectedStatus?.code !== newStatus;

        this.page = newPage;
        this.limit = newLimit;
        this.currentKeyword = newKeyword;
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === newStatus) ||
            this.statusOptions[0];
        // cập nhật các select UI cho postType / highlighted / featured
        this.selectedPostType =
            this.postTypeOptions.find((opt) => opt.code === newPostType) ||
            this.postTypeOptions[0];
        this.selectedIsHighlighted =
            this.highlightedOptions.find(
                (opt) => opt.code === newIsHighlighted
            ) || this.highlightedOptions[0];
        this.selectedIsFeatured =
            this.featuredOptions.find((opt) => opt.code === newIsFeatured) ||
            this.featuredOptions[0];

        // Đồng bộ first index với page cho PrimeNG paginator
        this.first = (this.page - 1) * this.limit;

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
            newPostType !== undefined ||
            newIsFeatured !== undefined ||
            newIsHighlighted !== undefined
        ) {
            // bỏ qua sự kiện lazy load tiếp theo mà PrimeNG có thể phát ra
            this.skipLazyLoads += 1;

            const paramsToLoad: any = {
                page: this.page,
                limit: this.limit,
                keyword: this.currentKeyword,
                status: this.selectedStatus?.code || undefined,
                categoryId: newCategoryId,
                postType: newPostType,
                isFeatured: newIsFeatured,
                isHighlighted: newIsHighlighted
            };

            // Gọi store để fetch dữ liệu; truyền skipSync nếu cần để tránh điều hướng URL khi đang hydrate
            this.postStore.load(paramsToLoad, {
                skipSync: !!options?.skipSync
            });
        }
    }

    // --- Các hàm trợ giúp để giảm trùng lặp cho các thao tác chọn và tải lại ---
    private idsFromSelected(): number[] {
        return this.selectedItems?.map((i) => i.id) || [];
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

    private reloadCurrentData(): void {
        this.loadData(this.currentKeyword);
    }

    // Đặt lại phân trang về mặc định (page=1, limit=10) và xóa tất cả bộ lọc khác
    // URL kết quả sẽ chỉ chứa page=1 và limit=10 (các query params khác bị loại bỏ)
    resetPagination() {
        this.page = 1;
        this.limit = 10;

        // Xóa trạng thái bộ lọc cục bộ để UI phản ánh việc xóa bộ lọc
        this.currentKeyword = undefined;
        this.selectedStatus = this.statusOptions[0];
        this.selectedPostType = this.postTypeOptions[0];
        this.selectedIsHighlighted = this.highlightedOptions[0];
        this.selectedIsFeatured = this.featuredOptions[0];

        // Xây dựng params tối giản chỉ chứa page và limit
        const queryParams: any = {
            page: 1,
            limit: 10
        };

        // Ngăn subscription applyParams tải dữ liệu hai lần (chúng ta sẽ tải sau khi điều hướng)
        this._suppressApplyParamsLoad = true;

        // Điều hướng, thay thế URL và loại bỏ các query params khác bằng cách không dùng merge
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams,
                replaceUrl: true
            })
            .then(() => {
                // Sau khi điều hướng, tải dữ liệu với bộ lọc đã được xóa.
                // Gọi load với skipSync=true để ngăn store tự động đồng bộ lại các query params cũ
                this.postStore
                    .load(
                        {
                            page: 1,
                            limit: 10,
                            keyword: undefined,
                            status: undefined,
                            categoryId: undefined,
                            postType: undefined,
                            isFeatured: undefined,
                            isHighlighted: undefined
                        },
                        { skipSync: true }
                    )
                    .finally(() => {
                        // UI đã được đồng bộ tự động
                    });
            });
    }

    /**
     * Xây dựng đối tượng params dùng để tải dữ liệu và điều hướng URL.
     * Chấp nhận categoryId tùy chọn và một đối tượng overrides để thiết lập page/limit/keyword
     */
    private buildFilterParams(categoryId?: number, overrides?: any) {
        // if caller didn't provide categoryId explicitly, preserve one from current route
        let resolvedCategoryId = categoryId;
        if (resolvedCategoryId === undefined) {
            const q = this.route.snapshot.queryParams['categoryId'];
            if (q !== undefined && q !== null && q !== '') {
                const n = Number(q);
                resolvedCategoryId = Number.isNaN(n) ? undefined : n;
            }
        }

        return {
            page: overrides?.page ?? 1,
            limit: overrides?.limit ?? this.limit,
            keyword: overrides?.keyword ?? this.currentKeyword ?? undefined,
            status: this.selectedStatus?.code ?? undefined,
            postType: this.selectedPostType?.code ?? undefined,
            isFeatured:
                this.selectedIsFeatured?.code === undefined
                    ? undefined
                    : Boolean(this.selectedIsFeatured?.code),
            isHighlighted:
                this.selectedIsHighlighted?.code === undefined
                    ? undefined
                    : Boolean(this.selectedIsHighlighted?.code),
            categoryId: resolvedCategoryId ?? undefined
        };
    }

    getStatusName(code: string | undefined): string {
        const found = this.statusOptions.find((opt) => opt.code === code);
        return found ? found.name : 'Không xác định';
    }

    getBgColorForStatus(code: string | undefined): string {
        switch (code) {
            case 'PUBLISHED':
                return 'bg-green-100 text-green-800';
            case 'ARCHIVED':
                return 'bg-gray-100 text-gray-800';
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
}

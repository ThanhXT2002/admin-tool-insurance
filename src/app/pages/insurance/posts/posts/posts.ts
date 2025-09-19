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
import { PostCategoryFacade } from '@/store/postCategory/postCategory.facade';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PostCategoryForm } from '../post-category-form/post-category-form';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PostCategory } from '@/interfaces/post-category.interface';
import { PostStore } from '@/store/post/post.store';
import { Post } from '@/interfaces/post.interface';

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
        Select
    ],
    providers: [ConfirmationService, MessageService],
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

    // Use store signals directly so UI stays in sync
    items = this.postStore.rows;
    totalRecords = 0;
    loading = false;
    selectedItems!: Post[] | null;

    page = 1;
    limit = 10;
    active: boolean | undefined = undefined;
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    private destroy$ = new Subject<void>();
    // counter to ignore a number of upcoming lazy load events (helps avoid duplicate loads)
    private skipLazyLoads = 0;
    private searchTimeout: any;

    showForm = false;
    isEditing = false;
    selectedItem: Post | null = null;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: 'PUBLISHED' },
        { name: 'Đã lưu trữ', code: 'ARCHIVED' },
        { name: 'Bản nháp', code: 'DRAFT' }
    ];

    selectedStatus = this.statusOptions[0];

    private applyParams(params: any) {
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

        // If anything changed that should reload data, trigger store load but avoid duplicate lazyLoad
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
            // ignore the next lazy load event that PrimeNG might fire
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

            // let the store handle fetching and URL syncing
            this.postStore.load(paramsToLoad);
        }
    }

    ngOnInit() {
        const queryParams = this.route.snapshot.queryParams;
        this.page = Number(queryParams['page']) || 1;
        this.limit = Number(queryParams['limit']) || 10;
        this.currentKeyword = queryParams['keyword'] || undefined;

        if (queryParams['active'] === 'true') {
            this.active = true;
        } else if (queryParams['active'] === 'false') {
            this.active = false;
        } else {
            this.active = undefined;
        }

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        // hydrate store from current query params on init via store helper
        const parsed =
            this.postStore.hydrateFromQueryParams(
                this.route.snapshot.queryParams as any
            ) || {};

        // update local UI fields from parsed values
        this.page = parsed.page ?? this.page;
        this.limit = parsed.limit ?? this.limit;
        this.currentKeyword = parsed.keyword ?? this.currentKeyword;
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === parsed.status) ||
            this.selectedStatus;

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.applyParams(params);
            });

        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const currentParams = this.route.snapshot.queryParams;
                const keyword = currentParams['keyword'] || undefined;
                this.loadData(keyword);
            });

        // Sync derived UI fields from store using signal effects
        effect(() => {
            // reading rows will register this effect; when rows change, turn off loading
            const _ = this.postStore.rows();
            this.loading = false;
        });

        effect(() => {
            const t = this.postStore.total();
            this.totalRecords = t;
        });

        // initial load
        this.loadData(this.currentKeyword);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
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
        this.loading = true;

        const statusCode = this.selectedStatus?.code;
        const params: any = {
            page: this.page,
            limit: this.limit,
            keyword: keyword ?? this.currentKeyword,
            status: statusCode ?? undefined
        };

        // call the store to load data; store will update signals used by template
        this.postStore.load(params).finally(() => {
            // keep loading false (store subscription also sets this)
            this.loading = false;
        });
    }

    onLazyLoad(event: any) {
        if (this.skipLazyLoads > 0) {
            this.skipLazyLoads -= 1;
            return;
        }

        // PrimeNG lazy event contains first and rows
        const first = Number(event.first) || 0;
        const rows = Number(event.rows) || this.limit;
        const newPage = Math.floor(first / rows) + 1;
        const pageChanged = newPage !== this.page;
        const limitChanged = rows !== this.limit;
        this.page = newPage;
        this.limit = rows;
        this.loading = true;
        this.loadData(this.currentKeyword);
    }

    openNew() {
        this.router.navigate(['/insurance/post/create']);
    }

    editItem(id: number) {
        // navigate to post edit page (path used by admin routes)
        this.router.navigate(['/insurance/post/update', id]);
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

    changeStatus() {}

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
                // keep selectedItems cleared in UI for now
                this.selectedItems = null;
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
        const ids = this.selectedItems.map((i) => i.id);

        this.selectedItems = null;
    }

    inactiveMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);

        this.selectedItems = null;
    }

    toggleChangeStatus(item: PostCategory) {
        if (!item) return;
        const newStatus = !item.active;
    }

    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;
        const fallback = 'assets/images/np-img.webp';
        if (target.src && !target.src.endsWith(fallback)) target.src = fallback;
    }
}

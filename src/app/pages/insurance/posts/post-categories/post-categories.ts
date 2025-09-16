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
import { PostCategory } from '@/pages/service/post-category.service';
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
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-post-categories',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        FormsModule,
        ToggleSwitch,
        Select
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './post-categories.html',
    styleUrl: './post-categories.scss'
})
export class PostCategories implements OnInit, OnDestroy {
    facade = inject(PostCategoryFacade) as PostCategoryFacade;
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    items = signal<PostCategory[]>([]);
    totalRecords = 0;
    loading = false;
    selectedItems!: PostCategory[] | null;
    // Local flag to indicate we're waiting for deleteMultiple result
    private _expectingDeleteMultiple = false;

    // Watcher: when we're expecting a deleteMultiple result, surface server errors as toast
    private _deleteMultipleWatcher = effect(() => {
        const err = this.facade.error();
        if (!err) return;
        if (this._expectingDeleteMultiple) {
            const serverDetail =
                err?.error?.errors ??
                err?.error?.message ??
                err?.message ??
                'Có lỗi xảy ra';
            try {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: serverDetail
                });
            } catch (e) {
                // ignore message errors
            }
            this._expectingDeleteMultiple = false;
        }
    });

    private _sync = effect(() => {
        const rows = this.facade.items();
        const total = this.facade.total();
        const loading = this.facade.loading();
        this.items.set(rows || []);
        this.totalRecords = total || 0;
        this.loading = !!loading;
    });

    page = 1;
    limit = 10;
    active: boolean | undefined = undefined;
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    private destroy$ = new Subject<void>();
    private skipNextLazyLoad = false;
    private searchTimeout: any;

    showForm = false;
    isEditing = false;
    selectedItem: PostCategory | null = null;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    selectedStatus = this.statusOptions[0];

    private applyParams(params: any) {
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        let newActive: boolean | undefined = undefined;
        if (params['active'] === 'true') {
            newActive = true;
        } else if (params['active'] === 'false') {
            newActive = false;
        }

        const pageChanged = this.page !== newPage;
        const limitChanged = this.limit !== newLimit;
        const keywordChanged = this.currentKeyword !== newKeyword;
        const activeChanged = this.active !== newActive;

        this.page = newPage;
        this.limit = newLimit;
        this.currentKeyword = newKeyword;
        this.active = newActive;

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === newActive) ||
            this.statusOptions[0];

        if (pageChanged || limitChanged || keywordChanged || activeChanged) {
            this.skipNextLazyLoad = true;
            setTimeout(() => (this.skipNextLazyLoad = false), 250);
            this.loadData(newKeyword);
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

        // Only load from server on init if store is empty. This avoids
        // unnecessary API calls when user navigates to Create/Update and then
        // returns without making changes: we can reuse the items already in store.
        const currentRows = this.facade.items() || [];
        if (!currentRows || currentRows.length === 0) {
            this.facade.load({
                page: this.page,
                limit: this.limit,
                keyword: this.currentKeyword,
                active: this.active
            });
        }

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
        this.facade.load({
            page: this.page,
            limit: this.limit,
            keyword,
            active: this.active
        });
    }

    onLazyLoad(event: any) {
        if (this.skipNextLazyLoad) return;

        const newPage =
            Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        const newLimit = event.rows || this.limit;

        const currentParams = this.route.snapshot.queryParams;
        const keyword = currentParams['keyword'] || null;

        let active = null;
        if (currentParams['active'] === 'true') active = true;
        else if (currentParams['active'] === 'false') active = false;

        if (newPage === this.page && newLimit === this.limit) return;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: newPage,
                limit: newLimit,
                keyword: keyword,
                active: active
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    openNew() {
        this.router.navigate(['/insurance/post-category/create']);
    }

    editItem(id: number) {
        this.router.navigate(['/insurance/post-category/update', id]);
    }

    onSaved(saved?: unknown) {
        this.showForm = false;
        this.isEditing = false;
    }

    closeForm(saved?: boolean) {
        this.showForm = false;
        this.selectedItem = null;
        this.isEditing = false;
        if (saved) this.loadData(this.currentKeyword);
    }

    deleteItem(item: PostCategory) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa danh mục này?',
            header: 'Xóa danh mục',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: () => this.facade.delete(item.id),
            reject: () =>
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác'
                })
        });
    }

    changeStatus() {
        const newActive = this.selectedStatus.code;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: 1,
                limit: this.limit,
                keyword: this.currentKeyword || null,
                active: newActive !== undefined ? newActive : null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
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
                // mark we're waiting for deleteMultiple result so we can show error if it fails
                this._expectingDeleteMultiple = true;
                this.facade.deleteMultiple(ids);
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
        this.facade.activeMultiple(ids, true);
        this.selectedItems = null;
    }

    inactiveMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);
        this.facade.activeMultiple(ids, false);
        this.selectedItems = null;
    }

    toggleChangeStatus(item: PostCategory) {
        if (!item) return;
        const newStatus = !item.active;
        this.facade.activeMultiple([item.id], newStatus);
    }

    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;
        const fallback = 'assets/images/default-category.webp';
        if (target.src && !target.src.endsWith(fallback)) target.src = fallback;
    }
}

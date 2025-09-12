import {
    Component,
    inject,
    OnInit,
    signal,
    ViewChild,
    OnDestroy,
    effect
} from '@angular/core';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PermissionService } from '@/pages/service/permission.service';
import { Permission } from '@/interfaces/permission.interface';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { PermissionsFacade } from '@/store/permissions/permissions.facade';
import { PermissionForm } from '../permission-form/permission-form';

@Component({
    selector: 'app-permissions',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        PermissionForm
    ],
    templateUrl: './permissions.html',
    providers: [ConfirmationService]
})
export class Permissions implements OnInit, OnDestroy {
    permissionService = inject(PermissionService);
    facade = inject(PermissionsFacade) as PermissionsFacade;
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    constructor(private confirmationService: ConfirmationService) {}

    permissions = signal<Permission[]>([]);
    totalRecords = 0;
    loading = false;
    // control permission form drawer
    isPermissionFormOpen = false;
    isEditing = false;
    selectedPermission: Permission | null = null;
    // sync facade signals to local UI state in an injection context
    private _sync = effect(() => {
        const rows = this.facade.permissions();
        const total = this.facade.total();
        const loading = this.facade.loading();
        this.permissions.set(rows || []);
        this.totalRecords = total || 0;
        this.loading = !!loading;
    });
    page = 1;
    limit = 10;
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    onGlobalFilter(table: Table, event: Event) {
        // Use server-side search: debounce and trigger load
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

    private searchTimeout: any;
    triggerSearch(keyword: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            // Get current params from URL to preserve page if keyword unchanged
            const currentParams = this.route.snapshot.queryParams;
            const currentKeyword = currentParams['keyword'] || '';
            const currentPage = Number(currentParams['page']) || 1;

            // Only reset to page 1 if keyword actually changed
            const shouldResetPage = currentKeyword !== keyword;
            const targetPage = shouldResetPage ? 1 : currentPage;

            // Navigate with search keyword and appropriate page
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: targetPage,
                    limit: this.limit,
                    keyword: keyword || null
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
        }, 350);
    }

    // Use a destroy$ Subject to signal unsubscription for multiple streams
    private destroy$ = new Subject<void>();
    // When params are applied from the URL we may want to ignore the next table lazy-load which
    // can race and overwrite those params. Set this flag briefly when applying params.
    private skipNextLazyLoad = false;

    // Centralized param application to avoid duplicated logic and race conditions
    private applyParams(params: any) {
        // cancel pending search debounce so manual URL edits are not overridden
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        const pageChanged = this.page !== newPage;
        const limitChanged = this.limit !== newLimit;
        const keywordChanged = this.currentKeyword !== newKeyword;

        // Always update local state to match URL
        this.page = newPage;
        this.limit = newLimit;
        this.currentKeyword = newKeyword;

        // Load data if any param changed
        if (pageChanged || limitChanged || keywordChanged) {
            // Mark to skip the immediate table lazy-load that may follow
            this.skipNextLazyLoad = true;
            // reset flag shortly after to allow normal lazy-loads
            setTimeout(() => (this.skipNextLazyLoad = false), 250);

            this.loadData(newKeyword);
        }
    }

    ngOnInit() {
        // Read initial query params
        const queryParams = this.route.snapshot.queryParams;
        this.page = Number(queryParams['page']) || 1;
        this.limit = Number(queryParams['limit']) || 10;
        this.currentKeyword = queryParams['keyword'] || undefined;

        // Load data with initial params via facade
        this.facade.load({
            page: this.page,
            limit: this.limit,
            keyword: this.currentKeyword
        });

        // Subscribe to query param changes (auto-unsubscribe via takeUntil)
        // This handles both programmatic navigation and manual URL changes
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.applyParams(params);
            });

        // refresh$ subscription also cleaned up by takeUntil
        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Reload with current URL params
                const currentParams = this.route.snapshot.queryParams;
                const keyword = currentParams['keyword'] || undefined;
                this.loadData(keyword);
            });
    }

    ngOnDestroy() {
        // signal subscriptions to complete and cleanup debounce timer
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
    }

    loadData(keyword?: string) {
        this.loading = true;
        // trigger load via facade
        this.facade.load({ page: this.page, limit: this.limit, keyword });
    }

    // PrimeNG lazy load event handler
    onLazyLoad(event: any) {
        // Skip if we just applied params from URL to avoid race conditions
        if (this.skipNextLazyLoad) {
            return;
        }

        // event.first = index of first row (0-based), event.rows = rows per page
        const newPage =
            Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        const newLimit = event.rows || this.limit;

        // Get current keyword from URL params to preserve it
        const currentParams = this.route.snapshot.queryParams;
        const keyword = currentParams['keyword'] || null;

        // If the table emitted a lazy-load that matches the current URL/state, don't navigate
        if (newPage === this.page && newLimit === this.limit) {
            return;
        }

        // Navigate with new pagination params while preserving keyword
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: newPage,
                limit: newLimit,
                keyword: keyword
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    openNew() {
        // Open the permission form in create mode
        this.selectedPermission = null;
        this.isEditing = false;
        this.isPermissionFormOpen = true;
    }

    editPermission(item: Permission) {
        // Open the permission form in edit mode with a cloned item
        this.selectedPermission = item ? ({ ...item } as Permission) : null;
        this.isEditing = true;
        this.isPermissionFormOpen = true;
    }

    onPermissionSaved(saved?: unknown) {
        this.isPermissionFormOpen = false;
    }

    deletePermission(item: Permission) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa bản ghi này không?',
            header: 'Xóa quyền',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Hủy',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Xóa',
                severity: 'danger'
            },

            accept: () => {
                // dispatch delete through facade (effect will handle API call and messages)
                this.facade.delete(item.id);
            },
            reject: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác'
                });
            }
        });
    }
}

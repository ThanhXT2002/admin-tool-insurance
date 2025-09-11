import { Component, inject, OnInit, signal, ViewChild, OnDestroy, effect } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsFacade } from '@/store/permissions/permissions.facade';
import { PermissionForm } from '../permission-form/permission-form';

@Component({
    selector: 'app-permissions',
    imports: [Button, TableModule, IconField, InputIcon, InputTextModule, ConfirmDialog, PermissionForm],
    templateUrl: './permissions.html',
    styleUrl: './permissions.scss',
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

    selectedPermissions: any[] = [];
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
            // Navigate with new search keyword and reset to page 1
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: 1,
                    limit: this.limit,
                    keyword: keyword || null
                },
                queryParamsHandling: 'merge'
            });
        }, 350);
    }

    private refreshSub: any;

    ngOnInit() {
        // Read initial query params
        const queryParams = this.route.snapshot.queryParams;
        this.page = Number(queryParams['page']) || 1;
        this.limit = Number(queryParams['limit']) || 10;
        this.currentKeyword = queryParams['keyword'] || undefined;

        // Load data with initial params via facade
        this.facade.load({ page: this.page, limit: this.limit, keyword: this.currentKeyword });

        // Subscribe to query param changes
        this.route.queryParams.subscribe((params) => {
            const newPage = Number(params['page']) || 1;
            const newLimit = Number(params['limit']) || 10;
            const newKeyword = params['keyword'] || undefined;

            // Check if any params changed
            const pageChanged = this.page !== newPage;
            const limitChanged = this.limit !== newLimit;
            const keywordChanged = this.currentKeyword !== newKeyword;

            if (pageChanged || limitChanged || keywordChanged) {
                this.page = newPage;
                this.limit = newLimit;
                this.currentKeyword = newKeyword;
                this.loadData(newKeyword);
            }
        });

        this.refreshSub = this.refreshService.refresh$.subscribe(() => {
            // Reload with current URL params
            const currentParams = this.route.snapshot.queryParams;
            const keyword = currentParams['keyword'] || undefined;
            this.loadData(keyword);
        });
    }

    ngOnDestroy() {
        // cleanup subscription and debounce timer
        if (this.refreshSub && typeof this.refreshSub.unsubscribe === 'function') {
            this.refreshSub.unsubscribe();
        }
        clearTimeout(this.searchTimeout);
    }

    loadData(keyword?: string) {
        this.loading = true;
        // trigger load via facade
        this.facade.load({ page: this.page, limit: this.limit, keyword });
    }

    // PrimeNG lazy load event handler
    onLazyLoad(event: any) {
        // event.first = index of first row (0-based), event.rows = rows per page
        const newPage = Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        const newLimit = event.rows || this.limit;
        const keyword = event?.globalFilter || this.route.snapshot.queryParams['keyword'] || null;

        // Navigate with new pagination params
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: newPage,
                limit: newLimit,
                keyword: keyword
            },
            queryParamsHandling: 'merge'
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
                this.messageService.add({ severity: 'warn', summary: 'Đã hủy', detail: 'Bạn đã hủy thao tác' });
            }
        });
    }
}

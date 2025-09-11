import { Component, inject, OnInit, signal, ViewChild, OnDestroy } from '@angular/core';
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

@Component({
    selector: 'app-permissions',
    imports: [Button, TableModule, IconField, InputIcon, InputTextModule, ConfirmDialog],
    templateUrl: './permissions.html',
    styleUrl: './permissions.scss',
    providers: [ConfirmationService, MessageService]
})
export class Permissions implements OnInit, OnDestroy {
    permissionService = inject(PermissionService);
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    constructor(private confirmationService: ConfirmationService) {}

    selectedPermissions: any[] = [];
    permissions = signal<Permission[]>([]);
    totalRecords = 0;
    loading = false;
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

        // Load data with initial params
        this.loadData(this.currentKeyword);

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
        this.permissionService.getAll({ page: this.page, limit: this.limit, keyword }).subscribe({
            next: (res) => {
                const rows = res.data?.rows || [];
                const total = res.data?.total || 0;
                this.permissions.set(rows);
                this.totalRecords = total;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading user items', error);
                this.permissions.set([]);
                this.totalRecords = 0;
                this.loading = false;
            }
        });
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
        // this.permissionService.isShowForm.set(true);
        // this.permissionService.isEditMode.set(false);
        // this.permissionService.dataEditItem.set(null);
    }

    editPermission(item: Permission) {
        // this.permissionService.dataEditItem.set(item);
        // this.permissionService.isEditMode.set(true);
        // this.permissionService.isShowForm.set(true);
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
                // Gọi endpoint xóa
                this.permissionService.delete(item.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa quyền thành công' });
                        // Reload with current URL params
                        const currentParams = this.route.snapshot.queryParams;
                        const keyword = currentParams['keyword'] || undefined;
                        this.loadData(keyword);
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err?.message || 'Không thể xóa quyền' });
                    }
                });
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Đã hủy', detail: 'Bạn đã hủy thao tác' });
            }
        });
    }
}

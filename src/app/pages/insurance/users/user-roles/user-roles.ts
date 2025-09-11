import { Component, inject, OnInit, signal, ViewChild, OnDestroy, effect } from '@angular/core';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { userRole, UserRoleService } from '@/pages/service/user-role.service';
import { UserRoleFacade } from '@/store/user-role/user-role.facade';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { UserRoleForm } from '../user-role-form/user-role-form';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
    selector: 'app-user-roles',
    imports: [Button, TableModule, IconField, InputIcon, InputTextModule, UserRoleForm, ConfirmDialog],
    templateUrl: './user-roles.html',
    styleUrl: './user-roles.scss',
    providers: [ConfirmationService]
})
export class UserRoles implements OnInit, OnDestroy {
    userRoleService = inject(UserRoleService);
    facade = inject(UserRoleFacade) as UserRoleFacade;
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);

    constructor(private confirmationService: ConfirmationService) {}

    selectedRoles: any[] = [];
    userRoles = signal<userRole[]>([]);
    totalRecords = 0;
    loading = false;
    // sync facade signals to local UI state in an injection context
    private _sync = effect(() => {
        const rows = this.facade.roles();
        const total = this.facade.total();
        const loading = this.facade.loading();
        this.userRoles.set(rows || []);
        this.totalRecords = total || 0;
        this.loading = !!loading;
    });
    page = 1;
    limit = 10;
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
            this.page = 1; // reset to first page on new search
            this.loadData(keyword);
        }, 350);
    }

    private refreshSub: any;

    ngOnInit() {
        this.refreshSub = this.refreshService.refresh$.subscribe(() => {
            this.loadData();
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
        this.facade.load({ page: this.page, limit: this.limit, keyword });
    }

    // PrimeNG lazy load event handler
    onLazyLoad(event: any) {
        // event.first = index of first row (0-based), event.rows = rows per page
        this.page = Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        this.limit = event.rows || this.limit;
        // If event has globalFilter, use it; otherwise reload current keyword
        const keyword = event?.globalFilter || undefined;
        this.loadData(keyword);
    }

    openNew() {
        this.userRoleService.isShowForm.set(true);
        this.userRoleService.isEditMode.set(false);
        this.userRoleService.dataEditItem.set(null);
    }

    editUserRole(role: userRole) {
        this.userRoleService.dataEditItem.set(role);
        this.userRoleService.isEditMode.set(true);
        this.userRoleService.isShowForm.set(true);
    }

    deleteUserRole(role: userRole) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa bản ghi này không?',
            header: 'Xóa vai trò',
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
                // Dispatch delete via facade; effect will handle API call and notifications
                this.facade.delete(role.id);
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Đã hủy', detail: 'Bạn đã hủy thao tác' });
            }
        });
    }
}

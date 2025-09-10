import { Component, inject, OnInit, signal, ViewChild, OnDestroy } from '@angular/core';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { userRole, UserRoleService } from '@/pages/service/user-role.service';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { UserRoleForm } from '../user-role-form/user-role-form';
import { RefreshService } from '@/pages/service/refresh.service';

@Component({
    selector: 'app-user-roles',
    imports: [Button, TableModule, IconField, InputIcon, InputTextModule, UserRoleForm],
    templateUrl: './user-roles.html',
    styleUrl: './user-roles.scss'
})
export class UserRoles implements OnInit, OnDestroy {
    userRoleService = inject(UserRoleService);
    private refreshService = inject(RefreshService);


    selectedRoles: any[] = [];
    userRoles = signal<userRole[]>([]);
    totalRecords = 0;
    loading = false;
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
        this.userRoleService.getAll({ page: this.page, limit: this.limit, keyword }).subscribe({
            next: (res) => {
                const rows = res.data?.rows || [];
                const total = res.data?.total || 0;
                this.userRoles.set(rows);
                this.totalRecords = total;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading user roles', error);
                this.userRoles.set([]);
                this.totalRecords = 0;
                this.loading = false;
            }
        });
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
    deleteUserRole(id: number) {
        // Implement delete functionality here
    }
    deleteSelected() {}
}

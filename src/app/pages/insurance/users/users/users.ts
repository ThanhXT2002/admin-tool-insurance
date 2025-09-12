import { Component, inject, OnInit, signal, ViewChild, OnDestroy, effect } from '@angular/core';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { UserService, User } from '@/pages/service/user.service';
import { UserFacade } from '@/store/user/user.facade';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';

@Component({
    selector: 'app-users',
    imports: [Button, TableModule, IconField, InputIcon, InputTextModule, ConfirmDialog],
    templateUrl: './users.html',
    styleUrl: './users.scss',
    providers: [ConfirmationService]
})
export class Users implements OnInit, OnDestroy {
    userService = inject(UserService);
    facade = inject(UserFacade) as UserFacade;
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    users = signal<User[]>([]);
    totalRecords = 0;
    loading = false;
    selectedUsers!: User[] | null;

    private _sync = effect(() => {
        const rows = this.facade.users();
        const total = this.facade.total();
        const loading = this.facade.loading();
        this.users.set(rows || []);
        this.totalRecords = total || 0;
        this.loading = !!loading;
    });

    page = 1;
    limit = 10;
    @ViewChild('dt') dt!: Table;

    private searchTimeout: any;
    private refreshSub: any;

    ngOnInit() {
        this.refreshSub = this.refreshService.refresh$.subscribe(() => this.loadData());
        // initial load
        this.loadData();
    }

    ngOnDestroy() {
        if (this.refreshSub && typeof this.refreshSub.unsubscribe === 'function') this.refreshSub.unsubscribe();
        clearTimeout(this.searchTimeout);
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

    triggerSearch(keyword: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.page = 1;
            this.loadData(keyword);
        }, 350);
    }

    loadData(keyword?: string) {
        this.loading = true;
        this.facade.load({ page: this.page, limit: this.limit, keyword });
    }

    onLazyLoad(event: any) {
        this.page = Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        this.limit = event.rows || this.limit;
        const keyword = event?.globalFilter || undefined;
        this.loadData(keyword);
    }

    // UI: show/hide form locally; integration with a separate user-form component assumed
    showForm = signal(false);
    editingUser = signal<User | null>(null);

    openNew() {
        this.editingUser.set(null);
        this.showForm.set(true);
    }

    editUser(user: User) {
        this.editingUser.set(user);
        this.showForm.set(true);
    }

    closeForm(saved?: boolean) {
        this.showForm.set(false);
        this.editingUser.set(null);
        if (saved) this.loadData();
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa người dùng này?',
            header: 'Xóa người dùng',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Hủy',
            acceptLabel: 'Xóa',
            accept: () => {
                this.facade.delete(user.id);
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: 'Đã hủy', detail: 'Bạn đã hủy thao tác' });
            }
        });
    }

    deleteMultipleUser() {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa những người dùng đã chọn?',
            header: 'Xóa nhiều người dùng',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // this.products.set(this.products().filter((val) => !this.selectedProducts?.includes(val)));
                this.selectedUsers = null;

            }
        });
    }
}

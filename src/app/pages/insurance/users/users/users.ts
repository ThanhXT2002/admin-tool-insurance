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
import { UserService, User } from '@/pages/service/user.service';
import { UserFacade } from '@/store/user/user.facade';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { UserForm } from '../user-form/user-form';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-users',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        UserForm,
        FormsModule,
        ToggleSwitch,
        Select
    ],
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
    private route = inject(ActivatedRoute);
    private router = inject(Router);

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
    active: boolean | undefined = undefined; // Default to show all users
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    // URL handling properties
    private destroy$ = new Subject<void>();
    private skipNextLazyLoad = false;

    private searchTimeout: any;

    showForm = false;
    isEditing = false;
    selectedUser: User | null = null;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    selectedStatus = this.statusOptions[0];

    // Centralized param application to avoid duplicated logic and race conditions
    private applyParams(params: any) {
        // cancel pending search debounce so manual URL edits are not overridden
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        // Handle active param: undefined means show all, 'true'/'false' means filter
        let newActive: boolean | undefined = undefined;
        if (params['active'] === 'true') {
            newActive = true;
        } else if (params['active'] === 'false') {
            newActive = false;
        }
        // If params['active'] is undefined or any other value, keep newActive as undefined

        const pageChanged = this.page !== newPage;
        const limitChanged = this.limit !== newLimit;
        const keywordChanged = this.currentKeyword !== newKeyword;
        const activeChanged = this.active !== newActive;

        // Always update local state to match URL
        this.page = newPage;
        this.limit = newLimit;
        this.currentKeyword = newKeyword;
        this.active = newActive;

        // Update selectedStatus to match active state
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === newActive) ||
            this.statusOptions[0];

        // Load data if any param changed
        if (pageChanged || limitChanged || keywordChanged || activeChanged) {
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

        // Handle active param: undefined means show all, 'true'/'false' means filter
        if (queryParams['active'] === 'true') {
            this.active = true;
        } else if (queryParams['active'] === 'false') {
            this.active = false;
        } else {
            this.active = undefined; // Show all by default
        }

        // Update selectedStatus to match active state
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        // Load data with initial params via facade
        this.facade.load({
            page: this.page,
            limit: this.limit,
            keyword: this.currentKeyword,
            active: this.active
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

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

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

            // Navigate with search keyword and appropriate page, preserving active filter
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
        // Skip if we just applied params from URL to avoid race conditions
        if (this.skipNextLazyLoad) {
            return;
        }

        // event.first = index of first row (0-based), event.rows = rows per page
        const newPage =
            Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        const newLimit = event.rows || this.limit;

        // Get current params from URL to preserve them
        const currentParams = this.route.snapshot.queryParams;
        const keyword = currentParams['keyword'] || null;

        // Handle active param correctly
        let active = null;
        if (currentParams['active'] === 'true') {
            active = true;
        } else if (currentParams['active'] === 'false') {
            active = false;
        }

        // If the table emitted a lazy-load that matches the current URL/state, don't navigate
        if (newPage === this.page && newLimit === this.limit) {
            return;
        }

        // Navigate with new pagination params while preserving keyword and active filter
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

    // UI: show/hide form locally; integration with a separate user-form component assumed

    openNew() {
        this.selectedUser = null;
        this.isEditing = false;
        this.showForm = true;
    }

    editUser(user: User) {
        this.selectedUser = user;
        this.isEditing = true;
        this.showForm = true;
    }

    onUserSaved(saved?: unknown) {
        this.showForm = false;
        this.isEditing = false;
    }

    closeForm(saved?: boolean) {
        this.showForm = false;
        this.selectedUser = null;
        this.isEditing = false;
        if (saved) {
            // Reload current page data
            this.loadData(this.currentKeyword);
        }
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa người dùng này?',
            header: 'Xóa người dùng',
            icon: 'pi pi-info-circle',
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
                this.facade.delete(user.id);
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

    changeStatus() {
        // Update active state from selectedStatus
        const newActive = this.selectedStatus.code;

        // Navigate with new active filter and reset to page 1
        // Use null to remove the param from URL when showing all users
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

    deleteMultipleUser() {
        if (!this.selectedUsers || this.selectedUsers.length === 0) {
            return;
        }

        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa những người dùng đã chọn?',
            header: 'Xóa nhiều người dùng',
            icon: 'pi pi-exclamation-triangle',
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
                if (this.selectedUsers) {
                    const ids = this.selectedUsers.map((user) => user.id);
                    this.facade.deleteMultiple(ids);
                    this.selectedUsers = null;
                }
            },
            reject: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác xóa'
                });
            }
        });
    }

    activeMultipleUser() {
        if (!this.selectedUsers || this.selectedUsers.length === 0) {
            return;
        }

        const ids = this.selectedUsers.map((user) => user.id);
        this.facade.activeMultiple(ids, true); // Set active = true
        this.selectedUsers = null; // Clear selection
    }

    inactiveMultipleUser() {
        if (!this.selectedUsers || this.selectedUsers.length === 0) {
            return;
        }

        const ids = this.selectedUsers.map((user) => user.id);
        this.facade.activeMultiple(ids, false); // Set active = false
        this.selectedUsers = null; // Clear selection
    }

    toggleChangeStatusUser(user: User) {
        if (!user) return;

        // Toggle the status: true becomes false, false becomes true
        const newStatus = !user.active;

        // Call API to update user status - the store will handle updating the UI
        this.facade.activeMultiple([user.id], newStatus);
    }

    /**
     * Image error handler used in the template. Sets a fallback image when
     * the original avatar fails to load. Protects against infinite loop by
     * checking the current src before setting the fallback.
     */
    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;

        const fallback = 'assets/images/avatar-default.webp';
        // Only replace if it's not already the fallback to avoid infinite loops
        if (target.src && !target.src.endsWith(fallback)) {
            target.src = fallback;
        }
    }
}

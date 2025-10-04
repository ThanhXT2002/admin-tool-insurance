import {
    ChangeDetectorRef,
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject,
    effect
} from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TreeTableModule, TreeTable } from 'primeng/treetable';
import { Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MenuItemStore } from '@/store/menu/menuItem.store';
import { MenuItem as MenuItemInterface } from '@/interfaces/menu.interface';
import { MenuItemForm } from '../menu-item-form/menu-item-form';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-menu-item',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TreeTableModule,
        Button,
        InputTextModule,
        ConfirmDialog,
        IconFieldModule,
        InputIconModule,
        SelectModule,
        ToggleSwitchModule,
        MenuItemForm
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './menu-item.html',
    styleUrl: './menu-item.scss'
})
export class MenuItem implements OnInit, OnDestroy {
    private itemStore = inject(MenuItemStore);
    private confirmation = inject(ConfirmationService);
    private message = inject(MessageService);
    private cd = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    files: TreeNode[] = [];
    cols: Column[] = [
        { field: 'label', header: 'Tên Menu' },
        { field: 'url', header: 'URL' },
        { field: 'order', header: 'Thứ tự' },
        { field: 'active', header: 'Trạng thái' },
        { field: 'actions', header: 'Thao tác' }
    ];

    active: boolean | undefined = undefined;
    categoryId!: number;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];
    selectedStatus = this.statusOptions[0];

    loading = false;

    // Form dialog state
    isFormOpen = false;
    isEditing = false;
    selectedMenu: any = null;

    private destroy$ = new Subject<void>();

    private _loadingEffect = effect(() => {
        const items = this.itemStore.items();
        const storeLoading = this.itemStore.loading();

        // Tắt loading local khi store không còn loading (bất kể có data hay không)
        if (!storeLoading && this.loading) {
            this.loading = false;
        }
    });

    private _dataEffect = effect(() => {
        const items = this.itemStore.items();
        // Tự động render khi store data thay đổi
        this.files = this.toTreeNodes(Array.isArray(items) ? items : []);
        // Force change detection để đảm bảo UI update
        this.cd.detectChanges();
    });

    @ViewChild('tt') tt!: TreeTable;

    ngOnInit() {
        // Lấy categoryId từ route params
        this.categoryId = Number(this.route.snapshot.params['id']);

        if (!this.categoryId) {
            this.message.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không tìm thấy category ID'
            });
            return;
        }

        // Hydrate from query params và prevent duplicate load
        const parsed =
            this.itemStore.hydrateFromQueryParams(
                this.categoryId,
                this.route.snapshot.queryParams as any
            ) || {};

        // Update local UI fields from parsed values
        const hasUrlParams =
            Object.keys(this.route.snapshot.queryParams).length > 0;
        const cacheMatched = (parsed as any)._cacheMatched;
        const hasCachedData = (parsed as any)._hasCachedData;

        if (!hasUrlParams && hasCachedData) {
            // Không có URL params nhưng có cache data - sử dụng cache
            this.active = this.itemStore.currentFilter()?.active;
            this.loading = false;
        } else if (hasUrlParams && cacheMatched) {
            // Có URL params và cache khớp - sử dụng cache data
            this.active = parsed.active;
            this.loading = false;
        } else {
            // Có URL params và cache không khớp hoặc không có cache - store đã tự load data
            this.active = parsed.active;
            // Hiển thị loading vì store đang gọi API
            this.loading = true;
        }

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        // Subscribe to query params changes
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            this.applyParams(p);
        });

        // Initial render will be handled by _dataEffect when store data is available
        // this.renderFromStore(); // Removed - _dataEffect will handle this
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        // dừng các effect của signal được tạo dưới dạng trường lớp để tránh rò rỉ bộ nhớ
        try {
            if (typeof (this as any)._loadingEffect === 'function')
                (this as any)._loadingEffect();
            if (typeof (this as any)._dataEffect === 'function')
                (this as any)._dataEffect();
        } catch (_) {}
    }

    private applyParams(params: any) {
        let newActive: boolean | undefined = undefined;
        if (params['active'] === 'true') newActive = true;
        else if (params['active'] === 'false') newActive = false;

        const changed = newActive !== this.active;
        this.active = newActive;

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        if (changed) this.loadData();
    }

    /**
     * Render data từ store signal (không gọi API)
     * Note: _dataEffect sẽ tự động render khi store data thay đổi
     */
    private renderFromStore() {
        // _dataEffect sẽ tự động handle việc này
        this.cd.markForCheck();
    }

    /**
     * Load dữ liệu menu items từ API (gọi khi cần refresh)
     * Sử dụng query param active để filter: true (chỉ active), false (chỉ inactive), undefined (tất cả)
     */
    async loadData() {
        this.loading = true;

        const query: { active?: boolean; includeChildren: boolean } = {
            includeChildren: true
        };

        if (this.active !== undefined) {
            query.active = this.active;
        }

        this.itemStore
            .loadByCategory(this.categoryId, query)
            .then(() => {
                this.renderFromStore();
            })
            .catch((e) => {
                console.error('Error loading menu items:', e);
                this.message.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải dữ liệu menu items'
                });
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * Convert MenuItem[] sang TreeNode[] cho PrimeNG TreeTable
     */
    private toTreeNodes(items: MenuItemInterface[]): TreeNode[] {
        return items.map((it) => ({
            data: {
                id: it.id,
                key: it.key,
                label: it.label,
                icon: it.icon,
                url: it.url,
                routerLink: it.routerLink,
                command: it.command,
                order: it.order,
                active: it.active,
                isBlank: it.isBlank,
                expanded: it.expanded,
                parentId: it.parentId,
                categoryId: it.categoryId
            },
            children:
                it.children && it.children.length > 0
                    ? this.toTreeNodes(it.children)
                    : undefined
        }));
    }

    /**
     * Thay đổi trạng thái filter và reload data
     */
    changeStatus() {
        this.active = this.selectedStatus.code;
        this.updateQueryParams();

        // Load data với proper loading state management
        this.loading = true;
        const query: { active?: boolean; includeChildren: boolean } = {
            includeChildren: true
        };

        if (this.active !== undefined) {
            query.active = this.active;
        }

        this.itemStore
            .loadByCategory(this.categoryId, query)
            .then(() => {
                this.renderFromStore();
            })
            .catch((e) => {
                console.error('Error loading menu items:', e);
                this.message.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải dữ liệu menu items'
                });
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * Cập nhật query params lên URL
     * Nếu active = undefined (tất cả trạng thái), xóa param active khỏi URL
     * replaceUrl: true để không lưu vào history, khi bấm Back sẽ thoát khỏi trang
     */
    private updateQueryParams() {
        const queryParams: any = {};

        // Nếu active = undefined, set null để xóa param khỏi URL
        // Nếu active có giá trị, set string của nó
        if (this.active !== undefined) {
            queryParams.active = String(this.active);
        } else {
            queryParams.active = null; // null sẽ xóa param khỏi URL
        }

        // Kiểm tra xem có thay đổi so với URL hiện tại không
        const currentParams = this.route.snapshot.queryParams;
        const needsUpdate = currentParams['active'] !== queryParams.active;

        if (needsUpdate) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true // Không lưu vào browser history
            });
        }
    }

    addNew() {
        console.log('MenuItem addNew called with categoryId:', this.categoryId);
        this.isEditing = false;
        this.selectedMenu = null;
        this.isFormOpen = true;
    }

    openEdit(rowData: any) {
        this.isEditing = true;
        this.selectedMenu = rowData;
        this.isFormOpen = true;
    }

    async deleteItem(rowData: any) {
        this.confirmation.confirm({
            message: `Xóa menu item "${rowData.label}"? (Sẽ xóa cả children)`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                this.loading = true;
                try {
                    await this.itemStore.delete(rowData.id, true);
                    this.message.add({
                        severity: 'success',
                        summary: 'Xóa',
                        detail: 'Đã xóa menu item'
                    });
                    await this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa menu item'
                    });
                } finally {
                    this.loading = false;
                }
            }
        });
    }

    async toggleActive(rowData: any) {
        this.loading = true;
        try {
            await this.itemStore.update(rowData.id, {
                ...rowData,
                active: !rowData.active
            });
            this.message.add({
                severity: 'success',
                summary: 'Cập nhật',
                detail: 'Đã cập nhật trạng thái'
            });
            await this.loadData();
        } catch (e) {
            console.error(e);
            this.message.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể cập nhật trạng thái'
            });
        } finally {
            this.loading = false;
        }
    }

    /**
     * Handle form save event - reload data after successful save
     */
    onMenuSaved() {
        // Reload data to reflect changes
        this.loadData();
    }
}

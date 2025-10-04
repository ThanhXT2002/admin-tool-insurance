import { Component, inject, OnDestroy, OnInit, effect } from '@angular/core';
import { Button } from 'primeng/button';
import { Toolbar } from 'primeng/toolbar';
import { MenuForm } from '../menu-form/menu-form';
import { PanelModule } from 'primeng/panel';
import { MenuCateStore } from '@/store/menu/menuCate.store';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TreeModule } from 'primeng/tree';
import { MenuTreeNode, MenuCategory } from '@/interfaces/menu.interface';
import { env } from 'process';
import { environment } from 'src/environments/environment';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
    selector: 'app-menu-list',
    imports: [
        Toolbar,
        Button,
        MenuForm,
        PanelModule,
        Select,
        MultiSelectModule,
        FormsModule,
        ConfirmDialog,
        ToggleSwitch,
        TreeModule
    ],
    templateUrl: './menu-list.html',
    styleUrl: './menu-list.scss',
    providers: [ConfirmationService]
})
export class MenuList implements OnInit, OnDestroy {
    menuCateStore = inject(MenuCateStore);

    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private destroy$ = new Subject<void>();
    private _isLoadingInFlight = false;
    private _initialized = false;
    private _suppressParamsLoad = false;

    loading = false;

    selectedMenu: MenuCategory | null = null;
    isEditing = false;
    isFormOpen = false;

    // Signals từ store
    categories = this.menuCateStore.categories;

    feUrl = environment.DOMAIN_FE;

    _value = effect(() => {
        console.log('Categories updated:', this.categories());
        this.expandAll();
    });

    activeBoolean = [
        { label: 'Hiển thị tất cả Menu', value: undefined },
        { label: 'Hoạt động', value: true },
        { label: 'Không hoạt động', value: false }
    ];

    includeItemsBoolean = [
        { label: 'Hiển thị Menu Item', value: true },
        { label: 'Không hiển thị Menu Item', value: false }
    ];

    activeItemsOnlyBoolean = [
        { label: 'Hiển thị tất cả Menu Item Active', value: undefined },
        { label: 'Hoạt động', value: true },
        { label: 'Không hoạt động', value: false }
    ];

    selectActive = this.activeBoolean[0].value;
    selectIncludeItems = this.includeItemsBoolean[0].value;
    selectActiveItemsOnly = this.activeItemsOnlyBoolean[0].value;

    ngOnInit() {
        // Đọc query params từ URL
        const queryParams = this.route.snapshot.queryParams;

        // Khôi phục filter values từ URL
        if (queryParams['active'] === 'true') {
            this.selectActive = true;
        } else if (queryParams['active'] === 'false') {
            this.selectActive = false;
        } else {
            this.selectActive = undefined;
        }

        if (queryParams['includeItems'] === 'true') {
            this.selectIncludeItems = true;
        } else if (queryParams['includeItems'] === 'false') {
            this.selectIncludeItems = false;
        } else {
            this.selectIncludeItems = true; // default
        }

        if (queryParams['activeItemsOnly'] === 'true') {
            this.selectActiveItemsOnly = true;
        } else if (queryParams['activeItemsOnly'] === 'false') {
            this.selectActiveItemsOnly = false;
        } else {
            this.selectActiveItemsOnly = undefined;
        }

        // Lắng nghe thay đổi query params
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                if (this._suppressParamsLoad) {
                    this._suppressParamsLoad = false;
                    return;
                }
                this.applyParams(params);
            });

        // Lắng nghe refresh event
        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.loadData();
            });

        // Load data ban đầu
        this.loadData();
        this._initialized = true;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load menu categories với filters hiện tại
     */
    async loadData() {
        if (this._isLoadingInFlight) return;

        this.loading = true;
        this._isLoadingInFlight = true;

        const query: any = {};

        if (this.selectActive !== undefined) {
            query.active = this.selectActive;
        }

        if (this.selectIncludeItems !== undefined) {
            query.includeItems = this.selectIncludeItems;
        }

        if (this.selectActiveItemsOnly !== undefined) {
            query.activeItemsOnly = this.selectActiveItemsOnly;
        }

        try {
            await this.menuCateStore.loadAll(query);
        } catch (error) {
            console.error('Error loading menu categories:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải danh sách menu'
            });
        } finally {
            this.loading = false;
            this._isLoadingInFlight = false;
        }
    }

    /**
     * Áp dụng params từ URL vào component state
     */
    private applyParams(params: any) {
        let changed = false;

        if (params['active'] === 'true' && this.selectActive !== true) {
            this.selectActive = true;
            changed = true;
        } else if (
            params['active'] === 'false' &&
            this.selectActive !== false
        ) {
            this.selectActive = false;
            changed = true;
        } else if (!params['active'] && this.selectActive !== undefined) {
            this.selectActive = undefined;
            changed = true;
        }

        if (
            params['includeItems'] === 'true' &&
            this.selectIncludeItems !== true
        ) {
            this.selectIncludeItems = true;
            changed = true;
        } else if (
            params['includeItems'] === 'false' &&
            this.selectIncludeItems !== false
        ) {
            this.selectIncludeItems = false;
            changed = true;
        }

        if (
            params['activeItemsOnly'] === 'true' &&
            this.selectActiveItemsOnly !== true
        ) {
            this.selectActiveItemsOnly = true;
            changed = true;
        } else if (
            params['activeItemsOnly'] === 'false' &&
            this.selectActiveItemsOnly !== false
        ) {
            this.selectActiveItemsOnly = false;
            changed = true;
        } else if (
            !params['activeItemsOnly'] &&
            this.selectActiveItemsOnly !== undefined
        ) {
            this.selectActiveItemsOnly = undefined;
            changed = true;
        }

        if (changed) {
            this.loadData();
        }
    }

    /**
     * Sync filters to URL và reload data
     */
    private syncFiltersToUrl() {
        const queryParams: any = {};

        if (this.selectActive !== undefined) {
            queryParams.active = String(this.selectActive);
        }

        if (this.selectIncludeItems !== undefined) {
            queryParams.includeItems = String(this.selectIncludeItems);
        }

        if (this.selectActiveItemsOnly !== undefined) {
            queryParams.activeItemsOnly = String(this.selectActiveItemsOnly);
        }

        this._suppressParamsLoad = true;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge'
        });
    }

    changeStatus() {
        if (!this._initialized) return;

        // Sync filters to URL và load data
        this.syncFiltersToUrl();
        this.loadData();
    }

    openNew() {
        this.selectedMenu = null;
        this.isEditing = false;
        this.isFormOpen = true;
    }

    editCategory(category: any) {
        this.selectedMenu = category;
        this.isEditing = true;
        this.isFormOpen = true;
    }

    deleteCategory(category: any) {
        this.confirmationService.confirm({
            message: `Bạn có chắc chắn muốn xóa menu "${category.name}"? Tất cả menu items bên trong sẽ bị xóa theo.`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Xóa',
            rejectLabel: 'Hủy',
            acceptButtonStyleClass: 'p-button-danger',
            accept: async () => {
                try {
                    await this.menuCateStore.delete(category.id, true);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Thành công',
                        detail: 'Đã xóa menu thành công'
                    });
                    this.loadData();
                } catch (error) {
                    console.error('Error deleting category:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa menu'
                    });
                }
            }
        });
    }

    async toggleActiveChange(category: any) {
        if (this._isLoadingInFlight) return;

        const id = category?.id;
        if (!id) return;

        const newActive = !category.active;

        this._isLoadingInFlight = true;
        try {
            await this.menuCateStore.batchActive([id], newActive);
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: `Cập nhật trạng thái menu thành công`
            });
        } catch (err) {
            console.error('Error toggling active:', err);
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể cập nhật trạng thái menu'
            });
        } finally {
            this._isLoadingInFlight = false;
        }
    }

    addItemToMenu(categoryId: number) {
        this.router.navigate(['/menu/item', categoryId]);
    }

    expandAll() {
        this.categories()?.forEach((node) => {
            const menus = node.menus;
            if (Array.isArray(menus)) {
                menus.forEach((menu) => this.expandRecursive(menu, true));
            }
        });
    }

    private expandRecursive(node: MenuTreeNode | any, isExpand: boolean) {
        // Support different node shapes (MenuTreeNode or PrimeNG MenuItem)
        (node as any).expanded = isExpand;

        // Some trees use `children`, others (e.g. MenuItem) may use `items`
        const children = (node as any).children ?? (node as any).items;

        if (Array.isArray(children)) {
            children.forEach((childNode: any) => {
                this.expandRecursive(childNode, isExpand);
            });
        }
    }

    onMenuSaved(saved?: unknown) {
        if (saved) {
            this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: this.isEditing
                    ? 'Cập nhật menu thành công'
                    : 'Tạo menu mới thành công'
            });
            this.loadData();
        }
        this.isFormOpen = false;
        this.selectedMenu = null;
        this.isEditing = false;
    }
}

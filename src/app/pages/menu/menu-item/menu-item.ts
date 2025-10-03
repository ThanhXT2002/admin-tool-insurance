import {
    ChangeDetectorRef,
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject
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
        CommonModule,
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

    selectedNodes: any[] | null = null;

    active: boolean | undefined = undefined;
    categoryId!: number;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];
    selectedStatus = this.statusOptions[0];

    loading = false;

    private destroy$ = new Subject<void>();

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

        // Read query params và hydrate từ store (sử dụng cache nếu có)
        const qp = this.route.snapshot.queryParams;

        if (qp['active'] === 'true') this.active = true;
        else if (qp['active'] === 'false') this.active = false;
        else this.active = undefined;

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        // Kiểm tra cache trong store
        const hydrated = this.itemStore.hydrateFromQueryParams(
            this.categoryId,
            qp
        );

        if (hydrated.fromCache) {
            // Đã có cache -> đồng bộ filter từ store
            if (hydrated.filter) {
                this.active = hydrated.filter.active;
                this.selectedStatus =
                    this.statusOptions.find(
                        (opt) => opt.code === this.active
                    ) || this.statusOptions[0];
            }
            // Render từ store, không cần gọi API
            this.renderFromStore();
            this.loading = false;
        } else if (hydrated.needsLoad) {
            // Không có cache -> gọi API
            this.loadData();
        }

        // Subscribe to query params changes
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            this.applyParams(p);
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private applyParams(params: any) {
        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

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
     */
    private renderFromStore() {
        const items = this.itemStore.items();
        this.files = this.toTreeNodes(Array.isArray(items) ? items : []);
        this.cd.markForCheck();
    }

    /**
     * Load dữ liệu menu items từ API (gọi khi cần refresh)
     * Sử dụng query param active để filter: true (chỉ active), false (chỉ inactive), undefined (tất cả)
     */
    async loadData() {
        this.loading = true;
        try {
            // Xây dựng query: includeChildren luôn true để lấy tree structure
            const query: { active?: boolean; includeChildren: boolean } = {
                includeChildren: true
            };

            // Nếu active không phải undefined, truyền vào query
            if (this.active !== undefined) {
                query.active = this.active;
            }

            // Gọi store để load data - store sẽ gọi API với query này
            await this.itemStore.loadByCategory(this.categoryId, query);

            // Render từ store sau khi load xong
            this.renderFromStore();
        } catch (e) {
            console.error('Error loading menu items:', e);
            this.message.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải dữ liệu menu items'
            });
        } finally {
            this.loading = false;
        }
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
        // Gọi lại loadData với active mới
        this.loadData();
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

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true // Không lưu vào browser history
        });
    }

    handleSelectionChange(ev: any) {
        if (!ev) return this.onSelectionChange([]);
        if (Array.isArray(ev)) return this.onSelectionChange(ev as any[]);
        return this.onSelectionChange([ev]);
    }

    onSelectionChange(selection: any[]) {
        this.selectedNodes = selection || null;
    }

    private collectIds(node: any, out: number[]) {
        if (!node) return;
        const id = node?.data?.id ?? node?.id;
        if (typeof id === 'number') out.push(id);
        const children = node?.children ?? node?.children;
        if (children && children.length) {
            children.forEach((c: any) => this.collectIds(c, out));
        }
    }

    private getSelectedIds(): number[] {
        const ids: number[] = [];
        if (!this.selectedNodes || this.selectedNodes.length === 0) return ids;
        const seen = new Set<number>();
        const addNode = (n: any) => {
            const local: number[] = [];
            this.collectIds(n, local);
            local.forEach((id) => {
                if (!seen.has(id)) {
                    seen.add(id);
                    ids.push(id);
                }
            });
        };
        this.selectedNodes.forEach((s) => addNode(s));
        return ids;
    }

    addNew() {
        console.log('Open create dialog for category:', this.categoryId);
        // TODO: Open dialog to create new menu item
    }

    openEdit(rowData: any) {
        console.log('Open edit dialog for item:', rowData);
        // TODO: Open dialog to edit menu item
    }

    async deleteItem(rowData: any) {
        this.confirmation.confirm({
            message: `Xóa menu item "${rowData.label}"? (Sẽ xóa cả children)`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
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
                }
            }
        });
    }

    async toggleActive(rowData: any) {
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
        }
    }

    async bulkActivate() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn menu items'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Kích hoạt ${ids.length} menu items đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.itemStore.batchActive(ids, true);
                    this.message.add({
                        severity: 'success',
                        summary: 'Kích hoạt',
                        detail: 'Đã kích hoạt'
                    });
                    await this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể kích hoạt'
                    });
                }
            }
        });
    }

    async bulkDeactivate() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn menu items'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Vô hiệu hóa ${ids.length} menu items đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.itemStore.batchActive(ids, false);
                    this.message.add({
                        severity: 'success',
                        summary: 'Vô hiệu hóa',
                        detail: 'Đã vô hiệu hóa'
                    });
                    await this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể vô hiệu hóa'
                    });
                }
            }
        });
    }

    async bulkDelete() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn menu items'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Xóa ${ids.length} menu items đã chọn? (Bao gồm cả children)`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: async () => {
                try {
                    await Promise.all(
                        ids.map((id) => this.itemStore.delete(id, true))
                    );
                    this.message.add({
                        severity: 'success',
                        summary: 'Xóa',
                        detail: 'Đã xóa các menu items'
                    });
                    await this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa'
                    });
                }
            }
        });
    }
}

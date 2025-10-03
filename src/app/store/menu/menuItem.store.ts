import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '../_base/base-store-signal';
import {
    MenuItem,
    MenuItemBatchOrderDto,
    MenuItemDto,
    MenuItemReorderDto
} from '@/interfaces/menu.interface';
import { MenuService } from '@/pages/service/menu.service';

/**
 * State interface cho MenuItem Store
 */
interface MenuItemState {
    items: MenuItem[];
    selectedItem: MenuItem | null;
    currentCategoryId: number | null;
    currentFilter?: { active?: boolean }; // Lưu filter params hiện tại
}

/**
 * Store quản lý state cho MenuItem
 * Kế thừa BaseStoreSignal để có sẵn các method: snapshot, set, patch, select, run, reset
 */
@Injectable({ providedIn: 'root' })
export class MenuItemStore extends BaseStoreSignal<MenuItemState> {
    private api = inject(MenuService);

    // Selectors - computed signals từ state
    public items = this.select((s) => s.items);
    public selectedItem = this.select((s) => s.selectedItem);
    public currentCategoryId = this.select((s) => s.currentCategoryId);
    public currentFilter = this.select((s) => s.currentFilter);

    /**
     * Khởi tạo state mặc định
     */
    protected getInitialState(): MenuItemState {
        return {
            items: [],
            selectedItem: null,
            currentCategoryId: null,
            currentFilter: undefined
        };
    }

    /**
     * Load chi tiết một menu item
     */
    async loadById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getById(id))
        );
        const item = res?.data as MenuItem;
        this.patch({ selectedItem: item });
        return item;
    }

    /**
     * Load menu items theo category (tree structure)
     */
    async loadByCategory(
        categoryId: number,
        query?: { active?: boolean; includeChildren?: boolean },
        options?: { skipSync?: boolean }
    ) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getByCategory(categoryId, query))
        );
        const items = (res?.data || []) as MenuItem[];
        // Lưu cả filter vào state
        this.patch({
            items,
            currentCategoryId: categoryId,
            currentFilter: { active: query?.active }
        });
        return items;
    }

    /**
     * Hydrate store from query params (kiểm tra cache)
     * @param categoryId - ID của category cần load
     * @param qp - Query params object từ ActivatedRoute
     * @returns Object chứa thông tin về cache và filter
     */
    hydrateFromQueryParams(categoryId: number, qp: Record<string, any>) {
        const parsed: { active?: boolean } = {};

        // Parse active filter
        if (qp['active'] === 'true') parsed.active = true;
        else if (qp['active'] === 'false') parsed.active = false;
        // undefined = không filter

        // Kiểm tra xem có data trong cache không
        const currentState = this.snapshot();
        const hasCachedData =
            currentState.currentCategoryId === categoryId &&
            currentState.items.length > 0;

        // So sánh filter: cache hợp lệ khi cùng categoryId VÀ cùng filter
        const filterMatches =
            currentState.currentFilter?.active === parsed.active;

        if (hasCachedData && filterMatches) {
            // Có cache VÀ filter khớp -> trả về cache
            return {
                items: currentState.items,
                filter: parsed,
                fromCache: true,
                needsLoad: false
            };
        } else {
            // Không có cache HOẶC filter khác -> cần gọi API
            return {
                items: [],
                filter: parsed,
                fromCache: false,
                needsLoad: true
            };
        }
    }

    /**
     * Load children của một menu item
     */
    async loadChildren(id: number, activeOnly = false) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getChildren(id, activeOnly))
        );
        return (res?.data || []) as MenuItem[];
    }

    /**
     * Đếm số children của menu item
     */
    async countChildren(id: number): Promise<number> {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.countChildren(id))
        );
        return res?.data?.count || 0;
    }

    /**
     * Tạo menu item mới
     */
    async create(data: MenuItemDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.create(data))
        );
        const created = res?.data as MenuItem;

        // Thêm vào danh sách nếu cùng category
        const currentCategoryId = this.snapshot().currentCategoryId;
        if (currentCategoryId === created.categoryId) {
            this._state.update((s) => ({
                ...s,
                items: [created, ...s.items]
            }));
        }

        return created;
    }

    /**
     * Cập nhật menu item
     */
    async update(id: number, data: MenuItemDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.update(id, data))
        );
        const updated = res?.data as MenuItem;

        // Cập nhật trong danh sách
        this._state.update((s) => ({
            ...s,
            items: this.updateItemInTree(s.items, updated),
            selectedItem:
                s.selectedItem?.id === updated.id ? updated : s.selectedItem
        }));

        return updated;
    }

    /**
     * Xóa menu item (cascade xóa children)
     */
    async delete(id: number, hard = true) {
        await this.run(() => firstValueFrom(this.api.delete(id, hard)));

        // Xóa khỏi danh sách (recursive để xóa cả children)
        this._state.update((s) => ({
            ...s,
            items: this.removeItemFromTree(s.items, id),
            selectedItem: s.selectedItem?.id === id ? null : s.selectedItem
        }));

        return true;
    }

    /**
     * Batch active/inactive nhiều menu items
     */
    async batchActive(ids: number[], active: boolean) {
        await this.run(() => firstValueFrom(this.api.batchActive(ids, active)));

        // Cập nhật active flag (recursive)
        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            items: this.batchUpdateActiveInTree(s.items, idSet, active)
        }));

        return true;
    }

    /**
     * Reorder menu items (sau drag-drop)
     */
    async reorder(updates: MenuItemReorderDto[]) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.reorder(updates))
        );

        // Reload để đồng bộ lại tree structure
        const categoryId = this.snapshot().currentCategoryId;
        if (categoryId) {
            await this.loadByCategory(categoryId);
        }

        return res?.data;
    }

    /**
     * Batch update order
     */
    async batchUpdateOrder(items: MenuItemBatchOrderDto[]) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.batchUpdateOrder(items))
        );

        // Reload để đồng bộ
        const categoryId = this.snapshot().currentCategoryId;
        if (categoryId) {
            await this.loadByCategory(categoryId);
        }

        return res?.data;
    }

    /**
     * Di chuyển menu item sang parent khác
     */
    async moveItem(id: number, parentId: number | null, order?: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.moveItem(id, parentId, order))
        );
        const updated = res?.data as MenuItem;

        // Reload để đồng bộ tree
        const categoryId = this.snapshot().currentCategoryId;
        if (categoryId) {
            await this.loadByCategory(categoryId);
        }

        return updated;
    }

    /**
     * Duplicate (copy) menu item
     */
    async duplicate(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.duplicate(id))
        );
        const duplicated = res?.data as MenuItem;

        // Reload để hiển thị item mới
        const categoryId = this.snapshot().currentCategoryId;
        if (categoryId) {
            await this.loadByCategory(categoryId);
        }

        return duplicated;
    }

    /**
     * Refresh danh sách items của category hiện tại
     */
    async refresh() {
        const categoryId = this.snapshot().currentCategoryId;
        if (categoryId) {
            return this.loadByCategory(categoryId);
        }
        return [];
    }

    /**
     * Clear selected item
     */
    clearSelected() {
        this.patch({ selectedItem: null });
    }

    /**
     * Clear current category
     */
    clearCategory() {
        this.patch({ items: [], currentCategoryId: null });
    }

    // ==================== Helper Methods ====================

    /**
     * Update item trong tree (recursive)
     */
    private updateItemInTree(items: MenuItem[], updated: MenuItem): MenuItem[] {
        return items.map((item) => {
            if (item.id === updated.id) {
                return { ...updated, children: item.children };
            }
            if (item.children && item.children.length > 0) {
                return {
                    ...item,
                    children: this.updateItemInTree(item.children, updated)
                };
            }
            return item;
        });
    }

    /**
     * Remove item khỏi tree (recursive)
     */
    private removeItemFromTree(items: MenuItem[], id: number): MenuItem[] {
        return items
            .filter((item) => item.id !== id)
            .map((item) => {
                if (item.children && item.children.length > 0) {
                    return {
                        ...item,
                        children: this.removeItemFromTree(item.children, id)
                    };
                }
                return item;
            });
    }

    /**
     * Batch update active trong tree (recursive)
     */
    private batchUpdateActiveInTree(
        items: MenuItem[],
        idSet: Set<number>,
        active: boolean
    ): MenuItem[] {
        return items.map((item) => {
            const updated = idSet.has(item.id) ? { ...item, active } : item;
            if (updated.children && updated.children.length > 0) {
                return {
                    ...updated,
                    children: this.batchUpdateActiveInTree(
                        updated.children,
                        idSet,
                        active
                    )
                };
            }
            return updated;
        });
    }
}

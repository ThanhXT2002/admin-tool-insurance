import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '../_base/base-store-signal';
import {
    MenuCategory,
    MenuCategoryCreateDto,
    MenuCategoryTree,
    MenuCategoryUpdateDto
} from '@/interfaces/menu.interface';
import { MenuCateService } from '@/pages/service/menuCate.service';

/**
 * State interface cho MenuCategory Store
 */
interface MenuCategoryState {
    categories: MenuCategory[];
    selectedCategory: MenuCategory | null;
    selectedCategoryTree: MenuCategoryTree | null;
}

/**
 * Store quản lý state cho MenuCategory
 * Kế thừa BaseStoreSignal để có sẵn các method: snapshot, set, patch, select, run, reset
 */
@Injectable({ providedIn: 'root' })
export class MenuCateStore extends BaseStoreSignal<MenuCategoryState> {
    private api = inject(MenuCateService);

    // Selectors - computed signals từ state
    public categories = this.select((s) => s.categories);
    public selectedCategory = this.select((s) => s.selectedCategory);
    public selectedCategoryTree = this.select((s) => s.selectedCategoryTree);

    /**
     * Khởi tạo state mặc định
     */
    protected getInitialState(): MenuCategoryState {
        return {
            categories: [],
            selectedCategory: null,
            selectedCategoryTree: null
        };
    }

    /**
     * Load danh sách menu categories
     */
    async loadAll(query?: {
        active?: boolean;
        includeItems?: boolean;
        activeItemsOnly?: boolean;
    }) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getAll(query))
        );
        const categories = (res?.data || []) as MenuCategory[];
        this.patch({ categories });
        return categories;
    }

    /**
     * Load chi tiết một category
     */
    async loadById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getById(id))
        );
        const category = res?.data as MenuCategory;
        this.patch({ selectedCategory: category });
        return category;
    }

    /**
     * Load category kèm tree structure
     */
    async loadTreeById(id: number, activeOnly = false) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getTreeById(id, activeOnly))
        );
        const tree = res?.data as MenuCategoryTree;
        this.patch({ selectedCategoryTree: tree });
        return tree;
    }

    /**
     * Đếm số menu items trong category
     */
    async countMenuItems(id: number): Promise<number> {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.countMenuItems(id))
        );
        return res?.data?.count || 0;
    }

    /**
     * Tạo menu category mới
     */
    async create(data: MenuCategoryCreateDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.create(data))
        );
        const created = res?.data as MenuCategory;

        // Thêm vào danh sách
        this._state.update((s) => ({
            ...s,
            categories: [created, ...s.categories]
        }));

        return created;
    }

    /**
     * Cập nhật menu category
     */
    async update(id: number, data: MenuCategoryUpdateDto) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.update(id, data))
        );
        const updated = res?.data as MenuCategory;

        // Cập nhật trong danh sách
        this._state.update((s) => ({
            ...s,
            categories: s.categories.map((c) =>
                c.id === updated.id ? updated : c
            ),
            selectedCategory:
                s.selectedCategory?.id === updated.id
                    ? updated
                    : s.selectedCategory
        }));

        return updated;
    }

    /**
     * Xóa menu category (cascade xóa menu items)
     */
    async delete(id: number, hard = true) {
        await this.run(() => firstValueFrom(this.api.delete(id, hard)));

        // Xóa khỏi danh sách
        this._state.update((s) => ({
            ...s,
            categories: s.categories.filter((c) => c.id !== id),
            selectedCategory:
                s.selectedCategory?.id === id ? null : s.selectedCategory,
            selectedCategoryTree:
                s.selectedCategoryTree?.id === id
                    ? null
                    : s.selectedCategoryTree
        }));

        return true;
    }

    /**
     * Batch active/inactive nhiều categories
     */
    async batchActive(ids: number[], active: boolean) {
        await this.run(() => firstValueFrom(this.api.batchActive(ids, active)));

        // Cập nhật active flag
        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            categories: s.categories.map((c) =>
                idSet.has(c.id) ? { ...c, active } : c
            )
        }));

        return true;
    }

    /**
     * Refresh danh sách categories
     */
    async refresh() {
        return this.loadAll();
    }

    /**
     * Clear selected category
     */
    clearSelected() {
        this.patch({ selectedCategory: null, selectedCategoryTree: null });
    }

    /**
     * Load public menu by key (for preview)
     */
    async loadPublicMenu(key: string) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getPublicMenuByKey(key))
        );
        return res?.data as MenuCategoryTree;
    }
}

import { Injectable, inject } from '@angular/core';
import { BaseStoreSignal } from '../_base/base-store-signal';
import {
    ContactApiService,
    ContactItem
} from '../../pages/service/contactApi.service';
import { firstValueFrom } from 'rxjs';

/**
 * Mô tả trạng thái của danh sách Contact trong store (dùng cho admin)
 */
interface ContactListState {
    rows: ContactItem[];
    total: number;
    page: number;
    limit: number;
    keyword?: string;
}

/**
 * Store quản lý state của feature Contact
 * - Kế thừa BaseStoreSignal để tận dụng helpers chung
 * - Các phương thức load/refresh/setKeyword giữ nguyên hợp đồng hiện tại
 */
@Injectable({ providedIn: 'root' })
export class ContactStore extends BaseStoreSignal<ContactListState> {
    private api = inject(ContactApiService);
    /** Signal chứa danh sách bản ghi */
    public rows = this.select((s) => s.rows);
    /** Signal chứa tổng số bản ghi */
    public total = this.select((s) => s.total);
    /** Signal chứa trang hiện tại */
    public page = this.select((s) => s.page);
    /** Signal chứa limit hiện tại */
    public limit = this.select((s) => s.limit);
    /** Signal chứa keyword tìm kiếm */
    public keyword = this.select((s) => s.keyword);

    protected getInitialState(): ContactListState {
        return { rows: [], total: 0, page: 1, limit: 10 };
    }

    /**
     * Load dữ liệu từ API với các tham số phân trang/tìm kiếm
     * - Nếu truyền params thì patch lên state trước khi gọi API
     */
    async load(params?: Partial<ContactListState>) {
        if (params) {
            this.patch(params as any);
        }

        const q = this.snapshot();
        const result: any = await this.run(() =>
            firstValueFrom(
                this.api.getAll({
                    page: q.page,
                    limit: q.limit,
                    keyword: q.keyword
                })
            )
        );
        const payload: any = result?.data;
        this.patch({ rows: payload?.rows || [], total: payload?.total || 0 });
        return payload;
    }

    /** Tải lại trang hiện tại */
    async refresh() {
        const q = this.snapshot();
        return this.load({ page: q.page });
    }

    /** Set keyword rồi chuyển về trang 1 */
    setKeyword(keyword?: string) {
        this.load({ keyword, page: 1 });
    }

    /**
     * Hydrate state từ query params (chỉ áp dụng các tham số API được hỗ trợ)
     * Trả về một object partial nếu có giá trị hợp lệ, hoặc null nếu không có
     */
    hydrateFromQueryParams(queryParams: any): Partial<ContactListState> | null {
        if (!queryParams || Object.keys(queryParams).length === 0) return null;

        const parsed: Partial<ContactListState> = {};

        if (queryParams.page) parsed.page = Number(queryParams.page) || 1;
        if (queryParams.limit) parsed.limit = Number(queryParams.limit) || 10;
        if (queryParams.keyword) parsed.keyword = queryParams.keyword;

        if (Object.keys(parsed).length > 0) {
            // Áp dụng giá trị parsed lên state để component có thể skip initial load nếu muốn
            this.patch(parsed as any);
            return parsed;
        }
        return null;
    }
}

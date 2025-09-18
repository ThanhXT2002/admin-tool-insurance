import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '../_base/base-store-signal';
import { Post } from '@/interfaces/post.interface';
import { PostService } from '@/pages/service/post.service';

interface PostListState {
    rows: Post[];
    total: number;
    page: number;
    limit: number;
    keyword?: string;
}

@Injectable({ providedIn: 'root' })
export class PostStore extends BaseStoreSignal<PostListState> {
    private svc = inject(PostService);

    // Các signal suy diễn (derived)
    public rows = this.select((s) => s.rows);
    public total = this.select((s) => s.total);
    public page = this.select((s) => s.page);
    public limit = this.select((s) => s.limit);
    public keyword = this.select((s) => s.keyword);

    // Giá trị tính toán tiện lợi
    public hasMore = computed(() => this.total() > this.rows().length);

    protected getInitialState() {
        return { rows: [], total: 0, page: 1, limit: 10 } as PostListState;
    }

    // Tải danh sách với tham số tuỳ chọn (sẽ merge vào state hiện tại)
    async load(params?: Partial<PostListState>) {
        // update local query params
        if (params) this.patch(params);
        const q = this.snapshot();
        const result: any = await this.run(() =>
            firstValueFrom(
                this.svc.getAll({
                    page: q.page,
                    limit: q.limit,
                    keyword: q.keyword
                })
            )
        );
        // ApiResponse shape { data: { rows, total } }
        const payload: any = (result as any).data;
        this.patch({ rows: payload.rows || [], total: payload.total || 0 });
        return payload;
    }

    async refresh() {
        const q = this.snapshot();
        return this.load({ page: q.page });
    }

    // Lấy chi tiết một bài viết theo id (gọi backend)
    async fetchById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.svc.getById(id))
        );
        return (res as any).data as Post;
    }

    // Tạo mới và đưa vào danh sách (prepend). Nếu muốn có thể refetch thay vì thêm trực tiếp.
    async create(payload: any) {
        const res: any = await this.run(() =>
            firstValueFrom(this.svc.create(payload))
        );
        // prepend new item to rows
        const created = res.data as Post;
        this._state.update((s) => ({
            ...s,
            rows: [created, ...s.rows],
            total: s.total + 1
        }));
        return created;
    }

    async update(id: number, payload: any) {
        const res: any = await this.run(() =>
            firstValueFrom(this.svc.update(id, payload))
        );
        const updated = res.data as Post;
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
        }));
        return updated;
    }

    async delete(id: number) {
        await this.run(() => firstValueFrom(this.svc.delete(id)));
        // Loại bỏ item khỏi danh sách trong store sau khi backend xóa thành công
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => r.id !== id),
            total: Math.max(0, s.total - 1)
        }));
        return true;
    }

    async deleteMultiple(ids: number[]) {
        await this.run(() => firstValueFrom(this.svc.deleteMultiple(ids)));
        // Xoá nhiều item khỏi state sau khi backend trả về thành công
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => !ids.includes(r.id)),
            total: Math.max(0, s.total - ids.length)
        }));
        return true;
    }

    // Tải trang tiếp theo và thêm kết quả vào rows (cuộn vô hạn / tải thêm)
    async loadMore() {
        const q = this.snapshot();
        const nextPage = (q.page || 1) + 1;
        const result: any = await this.run(() =>
            firstValueFrom(
                this.svc.getAll({
                    page: nextPage,
                    limit: q.limit,
                    keyword: q.keyword
                })
            )
        );
        const payload: any = result.data;
        const newRows: Post[] = payload.rows || [];
        // Ghép thêm các kết quả trang mới vào danh sách hiện tại
        this._state.update((s) => ({
            ...s,
            rows: [...s.rows, ...newRows],
            page: nextPage,
            total: payload.total || s.total
        }));
        return payload;
    }
}

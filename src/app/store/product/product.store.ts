import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BaseStoreSignal } from '../_base/base-store-signal';
import { Product } from '@/interfaces/product.interface';
import { ProductApiService } from '@/pages/service/productApi.service';

interface ProductListState {
    rows: Product[];
    total: number;
    page: number;
    limit: number;

    keyword?: string;
    active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductStore extends BaseStoreSignal<ProductListState> {
    private api = inject(ProductApiService);
    private router = inject(Router);

    public rows = this.select((s) => s.rows);
    public total = this.select((s) => s.total);
    public page = this.select((s) => s.page);
    public limit = this.select((s) => s.limit);
    public keyword = this.select((s) => s.keyword);
    public active = this.select((s) => s.active);

    public hasMore = computed(() => this.total() > this.rows().length);

    protected getInitialState() {
        return { rows: [], total: 0, page: 1, limit: 10 } as ProductListState;
    }

    async load(
        params?: Partial<ProductListState>,
        options?: { skipSync?: boolean }
    ) {
        if (params) {
            const resettingPage =
                params.page == null &&
                (params.keyword !== undefined || params.active !== undefined);
            if (resettingPage) params = { ...params, page: 1 };
            this.patch(params);
            if (!options?.skipSync) this.syncQueryParamsToUrl();
        }

        const q = this.snapshot();
        const result: any = await this.run(() =>
            firstValueFrom(
                this.api.getAll({
                    page: q.page,
                    limit: q.limit,
                    keyword: q.keyword,
                    active: q.active
                })
            )
        );
        const payload: any = result?.data;
        this.patch({ rows: payload?.rows || [], total: payload?.total || 0 });
        return payload;
    }

    async refresh() {
        const q = this.snapshot();
        return this.load({ page: q.page });
    }

    setKeyword(keyword?: string) {
        this.load({ keyword, page: 1 });
    }

    async fetchById(id: number) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.getById(id))
        );
        return res?.data as Product;
    }

    async create(payload: any) {
        let toSend: any = payload;
        // If payload contains File or imgs File[] or icon File, convert to FormData
        try {
            const hasIconFile = payload && payload.icon instanceof File;
            const hasImgsFiles =
                payload &&
                Array.isArray(payload.imgs) &&
                payload.imgs.some((i: any) => i instanceof File);

            if (hasIconFile || hasImgsFiles) {
                console.log('🔧 Detected files, converting to FormData:', {
                    hasIconFile,
                    hasImgsFiles,
                    totalImgs: payload.imgs?.length || 0
                });
                toSend = this.api.buildFormData(payload);
            }
        } catch {}

        const res: any = await this.run(() =>
            firstValueFrom(this.api.create(toSend))
        );
        const created = res.data as Product;
        this._state.update((s) => ({
            ...s,
            rows: [created, ...s.rows],
            total: s.total + 1
        }));
        return created;
    }

    async update(id: number, payload: any) {
        let toSend: any = payload;
        try {
            const hasIconFile = payload && payload.icon instanceof File;
            const hasImgsFiles =
                payload &&
                Array.isArray(payload.imgs) &&
                payload.imgs.some((i: any) => i instanceof File);

            if (hasIconFile || hasImgsFiles) {
                console.log('🔧 Detected files, converting to FormData:', {
                    hasIconFile,
                    hasImgsFiles,
                    totalImgs: payload.imgs?.length || 0
                });
                toSend = this.api.buildFormData(payload);
            }
        } catch {}

        const res: any = await this.run(() =>
            firstValueFrom(this.api.update(id, toSend))
        );
        const updated = res.data as Product;
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
        }));
        return updated;
    }

    async delete(id: number) {
        await this.run(() => firstValueFrom(this.api.delete(id)));
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => r.id !== id),
            total: Math.max(0, s.total - 1)
        }));
        return true;
    }

    async deleteMultiple(ids: number[]) {
        await this.run(() => firstValueFrom(this.api.deleteMultiple(ids)));
        this._state.update((s) => ({
            ...s,
            rows: s.rows.filter((r) => !ids.includes(r.id)),
            total: Math.max(0, s.total - ids.length)
        }));
        return true;
    }

    async batchActive(ids: number[], active: boolean) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.batchActive(ids, active))
        );
        const data: any = res?.data;
        // If backend returns detailed updated rows, merge them. Otherwise optimistically update active flag.
        if (Array.isArray(data) && data.length > 0) {
            const updatedIds = new Set(data.map((d: any) => d.id));
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) =>
                    updatedIds.has(r.id)
                        ? { ...r, ...data.find((d: any) => d.id === r.id) }
                        : r
                )
            }));
            return data;
        }

        const idSet = new Set(ids);
        this._state.update((s) => ({
            ...s,
            rows: s.rows.map((r) => (idSet.has(r.id) ? { ...r, active } : r))
        }));
        return true;
    }

    async updateIsSaleOnline(id: number, isSaleOnline: boolean) {
        const res: any = await this.run(() =>
            firstValueFrom(this.api.patchIsSaleOnline(id, isSaleOnline))
        );
        const updated = res?.data as Product;
        if (updated && updated.id) {
            this._state.update((s) => ({
                ...s,
                rows: s.rows.map((r) => (r.id === updated.id ? updated : r))
            }));
        }
        return updated;
    }

    async loadMore() {
        const q = this.snapshot();
        const nextPage = (q.page || 1) + 1;
        const result: any = await this.run(() =>
            firstValueFrom(
                this.api.getAll({
                    page: nextPage,
                    limit: q.limit,
                    keyword: q.keyword,
                    active: q.active
                })
            )
        );
        const payload: any = result?.data;
        const newRows: Product[] = payload?.rows || [];
        this._state.update((s) => ({
            ...s,
            rows: [...s.rows, ...newRows],
            page: nextPage,
            total: payload?.total || s.total
        }));
        return payload;
    }

    // Hydrate store state from query parameters (only supported API params)
    hydrateFromQueryParams(queryParams: any): Partial<ProductListState> | null {
        if (!queryParams || Object.keys(queryParams).length === 0) return null;

        const parsed: Partial<ProductListState> = {};

        if (queryParams.page) parsed.page = Number(queryParams.page) || 1;
        if (queryParams.limit) parsed.limit = Number(queryParams.limit) || 10;
        if (queryParams.keyword) parsed.keyword = queryParams.keyword;
        if (queryParams.active === 'true') parsed.active = true;
        else if (queryParams.active === 'false') parsed.active = false;

        if (Object.keys(parsed).length > 0) {
            this.load(parsed, { skipSync: true });
            return parsed;
        }
        return null;
    }

    private syncQueryParamsToUrl() {
        const q = this.snapshot();
        const params: any = {};
        if (q.page) params.page = String(q.page);
        if (q.limit) params.limit = String(q.limit);
        if (q.keyword) params.keyword = q.keyword;
        if (q.active !== undefined && q.active !== null)
            params.active = String(q.active);

        try {
            const currentParams =
                this.router.routerState.snapshot.root.queryParams || {};
            const keys = new Set([
                ...Object.keys(currentParams),
                ...Object.keys(params)
            ]);
            let identical = true;
            for (const k of keys) {
                const a = currentParams[k];
                const b = params[k];
                if (
                    (a === undefined || a === null || a === '') &&
                    (b === undefined || b === null || b === '')
                )
                    continue;
                if (String(a) !== String(b)) {
                    identical = false;
                    break;
                }
            }
            if (!identical) {
                this.router.navigate([], {
                    queryParams: params,
                    replaceUrl: true
                });
            }
        } catch (err) {
            // ignore router errors in non-router contexts
        }
    }
}

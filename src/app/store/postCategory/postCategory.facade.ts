import { Injectable, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import * as PostCategorySelectors from './postCategory.selectors';
import * as PostCategoryActions from './postCategory.actions';
import { Subscription } from 'rxjs';
import {
    PostCategory,
    PostCategoryDto
} from '@/pages/service/post-category.service';

export interface IPostCategoryFacade {
    items: WritableSignal<PostCategory[]>;
    total: WritableSignal<number>;
    loading: WritableSignal<boolean>;
    error: WritableSignal<any | null>;
    lastQueryParams: WritableSignal<{
        page?: number;
        limit?: number;
        keyword?: string | null;
        active?: boolean;
    } | null>;
    load(params?: {
        page?: number;
        limit?: number;
        keyword?: string;
        active?: boolean;
        parentId?: number;
    }): void;
    create(data: any): void;
    update(id: number, data: any): void;
    delete(id: number): void;
    activeMultiple(ids: number[], active: boolean): void;
    destroy?(): void;
}

@Injectable({ providedIn: 'root' })
export class PostCategoryFacade implements IPostCategoryFacade {
    private subs = new Subscription();

    items: WritableSignal<PostCategory[]> = signal<PostCategory[]>([]);
    total: WritableSignal<number> = signal<number>(0);
    loading: WritableSignal<boolean> = signal<boolean>(false);
    error: WritableSignal<any | null> = signal<any | null>(null);
    lastQueryParams: WritableSignal<{
        page?: number;
        limit?: number;
        keyword?: string | null;
        active?: boolean;
    } | null> = signal<{
        page?: number;
        limit?: number;
        keyword?: string | null;
        active?: boolean;
    } | null>(null);
    selected: WritableSignal<PostCategory | null> = signal<PostCategory | null>(
        null
    );

    constructor(private store: Store) {
        this.subs.add(
            this.store
                .select(PostCategorySelectors.selectAllPostCategories)
                .subscribe((v: PostCategory[] | null | undefined) =>
                    this.items.set(v ?? [])
                )
        );
        this.subs.add(
            this.store
                .select(PostCategorySelectors.selectPostCategoriesTotal)
                .subscribe((v: number | null | undefined) =>
                    this.total.set(v ?? 0)
                )
        );
        this.subs.add(
            this.store
                .select(PostCategorySelectors.selectPostCategoriesLoading)
                .subscribe((v: boolean | null | undefined) =>
                    this.loading.set(!!v)
                )
        );
        this.subs.add(
            this.store
                .select(PostCategorySelectors.selectPostCategoriesError)
                .subscribe((v: any) => this.error.set(v ?? null))
        );
        this.subs.add(
            this.store
                .select(
                    PostCategorySelectors.selectPostCategoriesLastQueryParams
                )
                .subscribe((v: any) => this.lastQueryParams.set(v ?? null))
        );
        this.subs.add(
            this.store
                .select(PostCategorySelectors.selectSelectedPostCategory)
                .subscribe((v: PostCategory | null | undefined) =>
                    this.selected.set(v ?? null)
                )
        );
    }

    destroy() {
        this.subs.unsubscribe();
    }

    load(params?: {
        page?: number;
        limit?: number;
        keyword?: string;
        active?: boolean;
        parentId?: number;
    }) {
        this.store.dispatch(
            PostCategoryActions.loadPostCategories({ ...params })
        );
    }

    create(data: PostCategoryDto) {
        this.store.dispatch(PostCategoryActions.createPostCategory({ data }));
    }

    update(id: number, data: PostCategoryDto) {
        this.store.dispatch(
            PostCategoryActions.updatePostCategory({ id, data })
        );
    }

    delete(id: number) {
        this.store.dispatch(PostCategoryActions.deletePostCategory({ id }));
    }

    loadById(id: number) {
        this.store.dispatch(PostCategoryActions.loadPostCategory({ id }));
    }

    deleteMultiple(ids: number[]) {
        this.store.dispatch(PostCategoryActions.deletePostCategories({ ids }));
    }

    activeMultiple(ids: number[], active: boolean) {
        this.store.dispatch(
            PostCategoryActions.activePostCategories({ ids, active })
        );
    }
}

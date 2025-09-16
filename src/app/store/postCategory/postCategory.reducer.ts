import { createReducer, on } from '@ngrx/store';
import * as PostCategoryActions from './postCategory.actions';
import { PaginatedState } from '@/interfaces/paginated-state.interface';
import { PostCategory } from '@/pages/service/post-category.service';

export const postCategoryFeatureKey = 'postCategory';

export type State = PaginatedState<PostCategory> & {
    selected?: PostCategory | null;
};

export const initialState: State = {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    lastQueryParams: null,
    selected: null
};

export const reducer = createReducer(
    initialState,
    on(
        PostCategoryActions.loadPostCategories,
        (state, { page, limit, keyword, active, parentId }) => ({
            ...state,
            loading: true,
            error: null,
            lastQueryParams: {
                page: page ?? state.lastQueryParams?.page,
                limit: limit ?? state.lastQueryParams?.limit,
                keyword: keyword ?? state.lastQueryParams?.keyword,
                active: active ?? state.lastQueryParams?.active,
                // parentId is optional filter, keep previous if not provided
                parentId: parentId ?? (state.lastQueryParams as any)?.parentId
            }
        })
    ),
    on(
        PostCategoryActions.loadPostCategoriesSuccess,
        (state, { rows, total }) => ({ ...state, rows, total, loading: false })
    ),
    on(PostCategoryActions.loadPostCategoriesFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(PostCategoryActions.createPostCategory, (state) => ({
        ...state,
        loading: true
    })),
    on(PostCategoryActions.createPostCategorySuccess, (state, { item }) => ({
        ...state,
        rows: [item, ...state.rows],
        total: state.total + 1,
        loading: false
    })),
    on(PostCategoryActions.createPostCategoryFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(PostCategoryActions.updatePostCategory, (state) => ({
        ...state,
        loading: true
    })),
    on(PostCategoryActions.updatePostCategorySuccess, (state, { item }) => ({
        ...state,
        rows: state.rows.map((r) => (r.id === item.id ? item : r)),
        loading: false
    })),
    on(PostCategoryActions.updatePostCategoryFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(PostCategoryActions.deletePostCategory, (state) => ({
        ...state,
        loading: true
    })),
    on(PostCategoryActions.deletePostCategorySuccess, (state, { id }) => ({
        ...state,
        rows: state.rows.filter((r) => r.id !== id),
        total: Math.max(0, state.total - 1),
        loading: false
    })),
    on(PostCategoryActions.deletePostCategoryFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(PostCategoryActions.loadPostCategorySuccess, (state, { item }) => ({
        ...state,
        selected: item
    })),
    // Khi load một option riêng lẻ (ví dụ để hiển thị label cho select),
    // chúng ta upsert item vào rows nếu chưa có
    on(PostCategoryActions.loadPostCategoryOptionSuccess, (state, { item }) => {
        const exists = state.rows.some((r) => r.id === item.id);
        return exists
            ? state
            : { ...state, rows: [item, ...state.rows], total: state.total + 1 };
    }),
    on(PostCategoryActions.deletePostCategoriesSuccess, (state, { ids }) => ({
        ...state,
        rows: state.rows.filter((r) => !ids.includes(r.id)),
        total: Math.max(0, state.total - ids.length),
        loading: false
    })),
    on(
        PostCategoryActions.activePostCategoriesSuccess,
        (state, { ids, active }) => ({
            ...state,
            rows: state.rows.map((r) =>
                ids.includes(r.id) ? { ...r, active } : r
            )
        })
    )
);

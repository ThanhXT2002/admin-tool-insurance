import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromPostCategory from './postCategory.reducer';

export const selectPostCategoryState =
    createFeatureSelector<fromPostCategory.State>(
        fromPostCategory.postCategoryFeatureKey
    );

export const selectAllPostCategories = createSelector(
    selectPostCategoryState,
    (s) => s?.rows ?? []
);
export const selectPostCategoriesTotal = createSelector(
    selectPostCategoryState,
    (s) => s?.total ?? 0
);
export const selectPostCategoriesLoading = createSelector(
    selectPostCategoryState,
    (s) => !!s?.loading
);
export const selectPostCategoriesError = createSelector(
    selectPostCategoryState,
    (s) => s?.error ?? null
);
export const selectPostCategoriesLastQueryParams = createSelector(
    selectPostCategoryState,
    (s) =>
        s?.lastQueryParams ?? {
            page: 1,
            limit: 10,
            keyword: null,
            active: undefined
        }
);

export const selectSelectedPostCategory = createSelector(
    selectPostCategoryState,
    (s) => (s as any)?.selected ?? null
);

export const selectPostCategoryById = (id: number) =>
    createSelector(
        selectPostCategoryState,
        (s) => (s?.rows ?? []).find((r) => r.id === id) ?? null
    );

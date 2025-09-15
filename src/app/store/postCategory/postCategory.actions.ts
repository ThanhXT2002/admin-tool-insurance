import { createAction, props } from '@ngrx/store';
import {
    PostCategory,
    PostCategoryDto

} from '@/pages/service/post-category.service';

// Actions cho feature PostCategory (thể loại bài viết) - pagination + CRUD
export const loadPostCategories = createAction(
    '[PostCategory] Load',
    props<{
        page?: number;
        limit?: number;
        keyword?: string;
        active?: boolean;
        parentId?: number;
    }>()
);
export const loadPostCategoriesSuccess = createAction(
    '[PostCategory] Load Success',
    props<{ rows: PostCategory[]; total: number }>()
);
export const loadPostCategoriesFailure = createAction(
    '[PostCategory] Load Failure',
    props<{ error: any }>()
);

export const createPostCategory = createAction(
    '[PostCategory] Create',
    props<{ data: PostCategoryDto }>()
);
export const createPostCategorySuccess = createAction(
    '[PostCategory] Create Success',
    props<{ item: PostCategory; message?: string }>()
);
export const createPostCategoryFailure = createAction(
    '[PostCategory] Create Failure',
    props<{ error: any }>()
);

export const updatePostCategory = createAction(
    '[PostCategory] Update',
    props<{ id: number; data: PostCategoryDto }>()
);
export const updatePostCategorySuccess = createAction(
    '[PostCategory] Update Success',
    props<{ item: PostCategory; message?: string }>()
);
export const updatePostCategoryFailure = createAction(
    '[PostCategory] Update Failure',
    props<{ error: any }>()
);

export const deletePostCategory = createAction(
    '[PostCategory] Delete',
    props<{ id: number }>()
);
export const deletePostCategorySuccess = createAction(
    '[PostCategory] Delete Success',
    props<{ id: number; message?: string }>()
);
export const deletePostCategoryFailure = createAction(
    '[PostCategory] Delete Failure',
    props<{ error: any }>()
);

// Fetch single item by id
export const loadPostCategory = createAction(
    '[PostCategory] Load By Id',
    props<{ id: number }>()
);
export const loadPostCategorySuccess = createAction(
    '[PostCategory] Load By Id Success',
    props<{ item: PostCategory }>()
);
export const loadPostCategoryFailure = createAction(
    '[PostCategory] Load By Id Failure',
    props<{ error: any }>()
);

// Bulk operations
export const deletePostCategories = createAction(
    '[PostCategory] Delete Multiple',
    props<{ ids: number[] }>()
);
export const deletePostCategoriesSuccess = createAction(
    '[PostCategory] Delete Multiple Success',
    props<{ ids: number[]; message?: string }>()
);
export const deletePostCategoriesFailure = createAction(
    '[PostCategory] Delete Multiple Failure',
    props<{ error: any }>()
);

export const activePostCategories = createAction(
    '[PostCategory] Active Multiple',
    props<{ ids: number[]; active: boolean }>()
);
export const activePostCategoriesSuccess = createAction(
    '[PostCategory] Active Multiple Success',
    props<{ ids: number[]; active: boolean; message?: string }>()
);
export const activePostCategoriesFailure = createAction(
    '[PostCategory] Active Multiple Failure',
    props<{ error: any }>()
);

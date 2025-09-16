import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as PostCategoryActions from './postCategory.actions';
import {
    PostCategoryService,
    PostCategoryDto
} from '@/pages/service/post-category.service';
import { catchError, map, switchMap, of, withLatestFrom, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import * as PostCategorySelectors from './postCategory.selectors';
import { BaseCrudEffects } from '@/store/_base/base-crud-effects';
import { Router } from '@angular/router';
import { LoadingService } from '@/layout/service/loading.service';

@Injectable()
export class PostCategoryEffects extends BaseCrudEffects {
    load$: any;
    create$: any;
    createComplete$: any;
    updateComplete$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;
    loadPostCategory$: any;
    deleteMultiple$: any;
    deleteMultipleSuccessReload$: any;
    activeMultiple$: any;

    constructor(
        actions$: Actions,
        private service: PostCategoryService,
        private store: Store,
        private router: Router,
        private loadingService: LoadingService
    ) {
        super(actions$);

        this.load$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.loadPostCategories),
                switchMap((action) =>
                    this.service.getAll(action as any).pipe(
                        map((res: any) =>
                            PostCategoryActions.loadPostCategoriesSuccess({
                                rows: res.data.rows || [],
                                total: res.data.total || 0
                            })
                        ),
                        catchError((error) =>
                            of(
                                PostCategoryActions.loadPostCategoriesFailure({
                                    error
                                })
                            )
                        )
                    )
                )
            )
        );

        this.create$ = this.makeCreateEffect(
            PostCategoryActions.createPostCategory,
            (p: any) => PostCategoryActions.createPostCategorySuccess(p),
            (p: any) => PostCategoryActions.createPostCategoryFailure(p),
            (data: PostCategoryDto) => this.service.create(data)
        );

        // Non-dispatching side-effect: hide global loading and navigate after create success
        this.createComplete$ = createEffect(
            () =>
                this.actions$.pipe(
                    ofType(PostCategoryActions.createPostCategorySuccess),
                    tap(() => {
                        // ensure global loading is hidden (defensive)
                        try {
                            this.loadingService.hide();
                        } catch (err) {}
                        // navigate to list
                        try {
                            this.router.navigate([
                                '/insurance/post-categories'
                            ]);
                        } catch (err) {
                            // ignore
                        }
                    })
                ),
            { dispatch: false }
        );

        this.update$ = this.makeUpdateEffect(
            PostCategoryActions.updatePostCategory,
            (p: any) => PostCategoryActions.updatePostCategorySuccess(p),
            (p: any) => PostCategoryActions.updatePostCategoryFailure(p),
            (id: number, data: PostCategoryDto) => this.service.update(id, data)
        );

        // Non-dispatching side-effect: hide global loading and navigate after update success
        this.updateComplete$ = createEffect(
            () =>
                this.actions$.pipe(
                    ofType(PostCategoryActions.updatePostCategorySuccess),
                    tap(() => {
                        // ensure global loading is hidden (defensive)
                        this.loadingService.hide();
                        // navigate to list
                        try {
                            this.router.navigate([
                                '/insurance/post-categories'
                            ]);
                        } catch (err) {
                            // ignore
                        }
                    })
                ),
            { dispatch: false }
        );

        this.delete$ = this.makeDeleteEffect(
            PostCategoryActions.deletePostCategory,
            (p: any) => PostCategoryActions.deletePostCategorySuccess(p),
            (p: any) => PostCategoryActions.deletePostCategoryFailure(p),
            (id: number) => this.service.delete(id)
        );

        // Load single post category by id
        this.loadPostCategory$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.loadPostCategory),
                switchMap(({ id }) =>
                    this.service.getById(id).pipe(
                        map((res: any) =>
                            PostCategoryActions.loadPostCategorySuccess({
                                item: res.data
                            })
                        ),
                        catchError((error) =>
                            of(
                                PostCategoryActions.loadPostCategoryFailure({
                                    error
                                })
                            )
                        )
                    )
                )
            )
        );

        // Delete multiple
        this.deleteMultiple$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.deletePostCategories),
                switchMap(({ ids }) =>
                    this.service.batchDelete(ids).pipe(
                        map((res: any) =>
                            PostCategoryActions.deletePostCategoriesSuccess({
                                ids: ids,
                                message: res?.message
                            })
                        ),
                        catchError((error) =>
                            of(
                                PostCategoryActions.deletePostCategoriesFailure(
                                    { error }
                                )
                            )
                        )
                    )
                )
            )
        );

        // Reload after delete multiple
        this.deleteMultipleSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.deletePostCategoriesSuccess),
                withLatestFrom(
                    this.store.select(
                        PostCategorySelectors.selectPostCategoriesLastQueryParams
                    ),
                    this.store.select(
                        PostCategorySelectors.selectPostCategoriesTotal
                    )
                ),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(
                        1,
                        Math.ceil(remaining / (limit || 10))
                    );
                    const targetPage = Math.min(page, maxPage);

                    return PostCategoryActions.loadPostCategories({
                        page: targetPage,
                        limit,
                        keyword: lastQueryParams.keyword ?? undefined,
                        active: lastQueryParams.active
                    });
                })
            )
        );

        // Activate/Deactivate multiple
        this.activeMultiple$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.activePostCategories),
                switchMap(({ ids, active }) =>
                    this.service.batchActive(ids, active).pipe(
                        map((res: any) =>
                            PostCategoryActions.activePostCategoriesSuccess({
                                ids,
                                active,
                                message: res?.message
                            })
                        ),
                        catchError((error) =>
                            of(
                                PostCategoryActions.activePostCategoriesFailure(
                                    { error }
                                )
                            )
                        )
                    )
                )
            )
        );

        this.deleteSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PostCategoryActions.deletePostCategorySuccess),
                withLatestFrom(
                    this.store.select(
                        PostCategorySelectors.selectPostCategoriesLastQueryParams
                    ),
                    this.store.select(
                        PostCategorySelectors.selectPostCategoriesTotal
                    )
                ),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(
                        1,
                        Math.ceil(remaining / (limit || 10))
                    );
                    const targetPage = Math.min(page, maxPage);

                    return PostCategoryActions.loadPostCategories({
                        page: targetPage,
                        limit,
                        keyword: lastQueryParams.keyword ?? undefined,
                        active: lastQueryParams.active
                    });
                })
            )
        );
    }
}

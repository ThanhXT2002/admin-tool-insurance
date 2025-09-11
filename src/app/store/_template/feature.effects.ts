import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as FeatureActions from './feature.actions';
// import { FeatureService } from 'src/app/pages/service/feature.service';
import { catchError, map, switchMap, of, withLatestFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import * as FeatureSelectors from './feature.selectors';
import { BaseCrudEffects } from '@/store/_base/base-crud-effects';

@Injectable()
export class FeatureEffects extends BaseCrudEffects {
    load$: any;
    create$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;

    constructor(
        actions$: Actions,
        // private featureService: FeatureService,
        private store: Store
    ) {
        super(actions$);
        // this.load$ = createEffect(() =>
        //     this.actions$.pipe(
        //         ofType(FeatureActions.loadFeature),
        //         switchMap((action) =>
        //             this.featureService.getAll(action as any).pipe(
        //                 map((res: any) => FeatureActions.loadFeatureSuccess({ rows: res.data.rows || [], total: res.data.total || 0 })),
        //                 catchError((error) => of(FeatureActions.loadFeatureFailure({ error })))
        //             )
        //         )
        //     )
        // );

        // // forward server message and auto-notify using BaseCrudEffects helpers
        // this.create$ = this.makeCreateEffect(
        //     FeatureActions.createFeature,
        //     (p: any) => FeatureActions.createFeatureSuccess(p),
        //     (p: any) => FeatureActions.createFeatureFailure(p),
        //     (data: any) => this.featureService.create(data)
        // );

        // this.update$ = this.makeUpdateEffect(
        //     FeatureActions.updateFeature,
        //     (p: any) => FeatureActions.updateFeatureSuccess(p),
        //     (p: any) => FeatureActions.updateFeatureFailure(p),
        //     (id: number, data: any) => this.featureService.update(id, data)
        // );

        // this.delete$ = this.makeDeleteEffect(
        //     FeatureActions.deleteFeature,
        //     (p: any) => FeatureActions.deleteFeatureSuccess(p),
        //     (p: any) => FeatureActions.deleteFeatureFailure(p),
        //     (id: number) => this.featureService.delete(id)
        // );

        // this.deleteSuccessReload$ = createEffect(() =>
        //     this.actions$.pipe(
        //         ofType(FeatureActions.deleteFeatureSuccess),
        //         withLatestFrom(this.store.select(FeatureSelectors.selectFeatureLastQueryParams), this.store.select(FeatureSelectors.selectFeatureTotal)),
        //         map(([action, lastQueryParams, total]) => {
        //             const limit = lastQueryParams.limit ?? 10;
        //             const page = lastQueryParams.page ?? 1;
        //             const remaining = Math.max(0, total ?? 0);
        //             const maxPage = Math.max(1, Math.ceil(remaining / (limit || 10)));
        //             const targetPage = Math.min(page, maxPage);

        //             return FeatureActions.loadFeature({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined });
        //         })
        //     )
        // );
    }
}

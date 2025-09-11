import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as PermissionsActions from './permissions.actions';
import { PermissionService } from 'src/app/pages/service/permission.service';
import { catchError, map, switchMap, of, tap, withLatestFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Store } from '@ngrx/store';
import * as PermissionsSelectors from './permissions.selectors';

@Injectable()
export class PermissionsEffects {
    load$: any;
    create$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;

    constructor(
        private actions$: Actions,
        private permissionService: PermissionService,
        private messageService: MessageService,
        private store: Store
    ) {
        this.load$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PermissionsActions.loadPermissions),
                switchMap((action) =>
                    this.permissionService.getAll(action as any).pipe(
                        map((res: any) => PermissionsActions.loadPermissionsSuccess({ rows: res.data.rows || [], total: res.data.total || 0 })),
                        catchError((error) => of(PermissionsActions.loadPermissionsFailure({ error })))
                    )
                )
            )
        );

        this.create$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PermissionsActions.createPermission),
                switchMap(({ data }) =>
                    this.permissionService.create(data).pipe(
                        map((res: any) => PermissionsActions.createPermissionSuccess({ item: res.data })),
                        catchError((error) => of(PermissionsActions.createPermissionFailure({ error })))
                    )
                )
            )
        );

        this.update$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PermissionsActions.updatePermission),
                switchMap(({ id, data }) =>
                    this.permissionService.update(id, data).pipe(
                        map((res: any) => PermissionsActions.updatePermissionSuccess({ item: res.data })),
                        catchError((error) => of(PermissionsActions.updatePermissionFailure({ error })))
                    )
                )
            )
        );
        this.delete$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PermissionsActions.deletePermission),
                switchMap(({ id }) =>
                    this.permissionService.delete(id).pipe(
                        map(() => PermissionsActions.deletePermissionSuccess({ id })),
                        tap(() => this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa quyền thành công' })),
                        catchError((error) => {
                            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: error?.error?.message || 'Không thể xóa quyền' });
                            return of(PermissionsActions.deletePermissionFailure({ error }));
                        })
                    )
                )
            )
        );

        // After a successful delete, reload current page using lastQueryParams from store.
        // If the current page becomes empty after deletion, decrement page to the last available page.
        this.deleteSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(PermissionsActions.deletePermissionSuccess),
                withLatestFrom(this.store.select(PermissionsSelectors.selectPermissionsLastQueryParams), this.store.select(PermissionsSelectors.selectPermissionsTotal)),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(1, Math.ceil(remaining / (limit || 10)));
                    const targetPage = Math.min(page, maxPage);

                    return PermissionsActions.loadPermissions({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined });
                })
            )
        );
    }
}

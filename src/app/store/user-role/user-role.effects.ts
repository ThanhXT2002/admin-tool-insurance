import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as UserRoleActions from './user-role.actions';
import { UserRoleService } from '@/pages/service/user-role.service';
import { catchError, map, switchMap, of, withLatestFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import * as UserRoleSelectors from './user-role.selectors';
import { BaseCrudEffects } from '@/store/_base/base-crud-effects';

@Injectable()
export class UserRoleEffects extends BaseCrudEffects {
    load$: any;
    create$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;

    constructor(
        actions$: Actions,
        private service: UserRoleService,
        private store: Store
    ) {
        super(actions$);

        this.load$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserRoleActions.loadUserRoles),
                switchMap((action) =>
                    this.service.getAll(action as any).pipe(
                        map((res: any) => UserRoleActions.loadUserRolesSuccess({ rows: res.data.rows || [], total: res.data.total || 0 })),
                        catchError((error) => of(UserRoleActions.loadUserRolesFailure({ error })))
                    )
                )
            )
        );

        this.create$ = this.makeCreateEffect(
            UserRoleActions.createUserRole,
            (p: any) => UserRoleActions.createUserRoleSuccess(p),
            (p: any) => UserRoleActions.createUserRoleFailure(p),
            (data: any) => this.service.createRole(data)
        );

        this.update$ = this.makeUpdateEffect(
            UserRoleActions.updateUserRole,
            (p: any) => UserRoleActions.updateUserRoleSuccess(p),
            (p: any) => UserRoleActions.updateUserRoleFailure(p),
            (id: number, data: any) => this.service.updateRole(id, data)
        );

        this.delete$ = this.makeDeleteEffect(
            UserRoleActions.deleteUserRole,
            (p: any) => UserRoleActions.deleteUserRoleSuccess(p),
            (p: any) => UserRoleActions.deleteUserRoleFailure(p),
            (id: number) => this.service.deleteRole(id)
        );

        this.deleteSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserRoleActions.deleteUserRoleSuccess),
                withLatestFrom(this.store.select(UserRoleSelectors.selectUserRolesLastQueryParams), this.store.select(UserRoleSelectors.selectUserRolesTotal)),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(1, Math.ceil(remaining / (limit || 10)));
                    const targetPage = Math.min(page, maxPage);

                    return UserRoleActions.loadUserRoles({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined });
                })
            )
        );
    }
}

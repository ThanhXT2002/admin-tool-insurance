import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as UserActions from './user.actions';
import { UserService } from '@/pages/service/user.service';
import { catchError, map, switchMap, of, withLatestFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import * as UserSelectors from './user.selectors';
import { BaseCrudEffects } from '@/store/_base/base-crud-effects';

@Injectable()
export class UserEffects extends BaseCrudEffects {
    load$: any;
    create$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;
    loadUser$: any;
    deleteMultiple$: any;
    deleteMultipleSuccessReload$: any;
    activeMultiple$: any;
    activeMultipleSuccess$: any;

    constructor(
        actions$: Actions,
        private service: UserService,
        private store: Store
    ) {
        super(actions$);

        this.load$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.loadUsers),
                switchMap((action) =>
                    this.service.getAll(action as any).pipe(
                        map((res: any) => UserActions.loadUsersSuccess({ rows: res.data.rows || [], total: res.data.total || 0 })),
                        catchError((error) => of(UserActions.loadUsersFailure({ error })))
                    )
                )
            )
        );

        this.create$ = this.makeCreateEffect(
            UserActions.createUser,
            (p: any) => UserActions.createUserSuccess(p),
            (p: any) => UserActions.createUserFailure(p),
            (data: any) => this.service.create(data)
        );

        this.update$ = this.makeUpdateEffect(
            UserActions.updateUser,
            (p: any) => UserActions.updateUserSuccess(p),
            (p: any) => UserActions.updateUserFailure(p),
            (id: number, data: any) => this.service.update(data)
        );

        this.delete$ = this.makeDeleteEffect(
            UserActions.deleteUser,
            (p: any) => UserActions.deleteUserSuccess(p),
            (p: any) => UserActions.deleteUserFailure(p),
            (id: number) => this.service.delete(id)
        );

        // Load single user by id
        this.loadUser$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.loadUser),
                switchMap(({ id }) =>
                    this.service.getById(id).pipe(
                        map((res: any) => UserActions.loadUserSuccess({ item: res.data })),
                        catchError((error) => of(UserActions.loadUserFailure({ error })))
                    )
                )
            )
        );

        // Delete multiple users
        this.deleteMultiple$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.deleteUsers),
                switchMap(({ ids }) =>
                    this.service.deleteMultiple(ids).pipe(
                        map((res: any) => UserActions.deleteUsersSuccess({ ids: ids, message: res?.message })),
                        catchError((error) => of(UserActions.deleteUsersFailure({ error })))
                    )
                )
            )
        );

        // After delete multiple success, reload page similar to single delete
        this.deleteMultipleSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.deleteUsersSuccess),
                withLatestFrom(this.store.select(UserSelectors.selectUsersLastQueryParams), this.store.select(UserSelectors.selectUsersTotal)),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(1, Math.ceil(remaining / (limit || 10)));
                    const targetPage = Math.min(page, maxPage);

                    return UserActions.loadUsers({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined, active: lastQueryParams.active });
                })
            )
        );

        // Activate/Deactivate multiple users
        this.activeMultiple$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.activeUsers),
                switchMap(({ ids, active }) =>
                    this.service.activeMultiple(ids, active).pipe(
                        map((res: any) => UserActions.activeUsersSuccess({ ids, active, message: res?.message })),
                        catchError((error) => of(UserActions.activeUsersFailure({ error })))
                    )
                )
            )
        );

        // On activeUsersSuccess update the store rows' active flags
        this.activeMultipleSuccess$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.activeUsersSuccess),
                map(({ ids, active }) => {
                    // We dispatch a load to refresh current page (could also update rows optimistically)
                    return UserActions.loadUsers({});
                })
            )
        );

        this.deleteSuccessReload$ = createEffect(() =>
            this.actions$.pipe(
                ofType(UserActions.deleteUserSuccess),
                withLatestFrom(this.store.select(UserSelectors.selectUsersLastQueryParams), this.store.select(UserSelectors.selectUsersTotal)),
                map(([action, lastQueryParams, total]) => {
                    const limit = lastQueryParams.limit ?? 10;
                    const page = lastQueryParams.page ?? 1;
                    const remaining = Math.max(0, total ?? 0);
                    const maxPage = Math.max(1, Math.ceil(remaining / (limit || 10)));
                    const targetPage = Math.min(page, maxPage);

                    return UserActions.loadUsers({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined, active: lastQueryParams.active });
                })
            )
        );
    }
}

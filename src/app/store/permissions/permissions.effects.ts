import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as PermissionsActions from './permissions.actions';
import { PermissionService } from 'src/app/pages/service/permission.service';
import { catchError, map, switchMap, of, withLatestFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import * as PermissionsSelectors from './permissions.selectors';
import { BaseCrudEffects } from '@/store/_base/base-crud-effects';

@Injectable()
export class PermissionsEffects extends BaseCrudEffects {
    load$: any;
    create$: any;
    update$: any;
    delete$: any;
    deleteSuccessReload$: any;
    // Đã xoá các effect thông báo riêng, vì BaseCrudEffects đã tự động phát thông báo.
    // Khi gọi makeCreateEffect/makeUpdateEffect/makeDeleteEffect, thông báo thành công/thất bại sẽ tự động được phát ra.
    // Không cần viết effect thông báo cho từng action nữa.
    // Nếu muốn tuỳ chỉnh nội dung hoặc tắt thông báo, truyền options vào hàm helper.

    constructor(
        actions$: Actions,
        private permissionService: PermissionService,
        private store: Store
    ) {
        super(actions$);
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

        this.create$ = this.makeCreateEffect(
            PermissionsActions.createPermission,
            (p: any) => PermissionsActions.createPermissionSuccess(p),
            (p: any) => PermissionsActions.createPermissionFailure(p),
            (data: any) => this.permissionService.create(data)
        );

        this.update$ = this.makeUpdateEffect(
            PermissionsActions.updatePermission,
            (p: any) => PermissionsActions.updatePermissionSuccess(p),
            (p: any) => PermissionsActions.updatePermissionFailure(p),
            (id: number, data: any) => this.permissionService.update(id, data)
        );
        this.delete$ = this.makeDeleteEffect(
            PermissionsActions.deletePermission,
            (p: any) => PermissionsActions.deletePermissionSuccess(p),
            (p: any) => PermissionsActions.deletePermissionFailure(p),
            (id: number) => this.permissionService.delete(id)
        );

        // Sau khi xoá thành công, sẽ tự động reload lại trang hiện tại dựa vào lastQueryParams trong store.
        // Nếu trang hiện tại bị trống sau khi xoá, sẽ tự động giảm về trang cuối cùng còn dữ liệu.
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

                    // Thông báo thành công đã được xử lý tự động bởi BaseCrudEffects.
                    // Việc reload lại dữ liệu sẽ được thực hiện ở đây.
                    return PermissionsActions.loadPermissions({ page: targetPage, limit, keyword: lastQueryParams.keyword ?? undefined });
                })
            )
        );
    }
}

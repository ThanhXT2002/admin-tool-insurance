import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, mergeMap } from 'rxjs/operators';
import * as NotificationActions from '@/store/notifications/notifications.actions';

/**
 * Small helper to generate common CRUD effects wiring.
 * Supports optional automatic notification dispatch on success/failure.
 */
export abstract class BaseCrudEffects {
    protected actions$: Actions;

    constructor(actions$: Actions) {
        this.actions$ = actions$;
    }

    protected makeCreateEffect<RequestDto = any, Res = any>(
        actionType: any,
        successActionCreator: (payload: any) => any,
        failureActionCreator: (payload: any) => any,
        serviceCall: (dto: RequestDto) => Observable<Res>,
        options?: {
            notifyOnSuccess?: boolean;
            notifyOnFailure?: boolean;
            successFallback?: string;
            failureFallback?: string;
            summary?: string;
            successSeverity?: 'success' | 'info' | 'warn' | 'error';
            failureSeverity?: 'success' | 'info' | 'warn' | 'error';
        }
    ) {
        const notifyOnSuccess = options?.notifyOnSuccess ?? true;
        const notifyOnFailure = options?.notifyOnFailure ?? true;
        return createEffect(() =>
            this.actions$.pipe(
                ofType(actionType),
                switchMap(({ data }: any) =>
                    serviceCall(data).pipe(
                        mergeMap((res: any) => {
                            const success = successActionCreator({
                                item: res.data,
                                message: res?.message
                            });
                            if (notifyOnSuccess) {
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.successSeverity ??
                                            'success',
                                        summary:
                                            options?.summary ?? 'Thành công',
                                        detail:
                                            res?.message ??
                                            options?.successFallback ??
                                            'Thực hiện thành công'
                                    });
                                return of(success, note);
                            }
                            return of(success);
                        }),
                        catchError((error: any) => {
                            const failure = failureActionCreator({ error });
                            if (notifyOnFailure) {
                                const serverDetail =
                                    error?.error?.errors ??
                                    error?.error?.message;
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.failureSeverity ?? 'error',
                                        summary: 'Lỗi',
                                        detail:
                                            serverDetail ??
                                            options?.failureFallback ??
                                            'Có lỗi xảy ra'
                                    });
                                return of(failure, note);
                            }
                            return of(failure);
                        })
                    )
                )
            )
        );
    }

    protected makeUpdateEffect<RequestDto = any, Res = any>(
        actionType: any,
        successActionCreator: (payload: any) => any,
        failureActionCreator: (payload: any) => any,
        serviceCall: (id: number, dto: RequestDto) => Observable<Res>,
        options?: {
            notifyOnSuccess?: boolean;
            notifyOnFailure?: boolean;
            successFallback?: string;
            failureFallback?: string;
            summary?: string;
            successSeverity?: 'success' | 'info' | 'warn' | 'error';
            failureSeverity?: 'success' | 'info' | 'warn' | 'error';
        }
    ) {
        const notifyOnSuccess = options?.notifyOnSuccess ?? true;
        const notifyOnFailure = options?.notifyOnFailure ?? true;
        return createEffect(() =>
            this.actions$.pipe(
                ofType(actionType),
                switchMap(({ id, data }: any) =>
                    serviceCall(id, data).pipe(
                        mergeMap((res: any) => {
                            const success = successActionCreator({
                                item: res.data,
                                message: res?.message
                            });
                            if (notifyOnSuccess) {
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.successSeverity ??
                                            'success',
                                        summary:
                                            options?.summary ?? 'Thành công',
                                        detail:
                                            res?.message ??
                                            options?.successFallback ??
                                            'Thực hiện thành công'
                                    });
                                return of(success, note);
                            }
                            return of(success);
                        }),
                        catchError((error: any) => {
                            const failure = failureActionCreator({ error });
                            if (notifyOnFailure) {
                                const serverDetail =
                                    error?.error?.errors ??
                                    error?.error?.message;
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.failureSeverity ?? 'error',
                                        summary: 'Lỗi',
                                        detail:
                                            serverDetail ??
                                            options?.failureFallback ??
                                            'Có lỗi xảy ra'
                                    });
                                return of(failure, note);
                            }
                            return of(failure);
                        })
                    )
                )
            )
        );
    }

    protected makeDeleteEffect<Res = any>(
        actionType: any,
        successActionCreator: (payload: any) => any,
        failureActionCreator: (payload: any) => any,
        serviceCall: (id: number) => Observable<Res>,
        options?: {
            notifyOnSuccess?: boolean;
            notifyOnFailure?: boolean;
            successFallback?: string;
            failureFallback?: string;
            summary?: string;
            successSeverity?: 'success' | 'info' | 'warn' | 'error';
            failureSeverity?: 'success' | 'info' | 'warn' | 'error';
        }
    ) {
        const notifyOnSuccess = options?.notifyOnSuccess ?? true;
        const notifyOnFailure = options?.notifyOnFailure ?? true;
        return createEffect(() =>
            this.actions$.pipe(
                ofType(actionType),
                switchMap(({ id }: any) =>
                    serviceCall(id).pipe(
                        mergeMap((res: any) => {
                            const success = successActionCreator({
                                id,
                                message: res?.message
                            });
                            if (notifyOnSuccess) {
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.successSeverity ??
                                            'success',
                                        summary:
                                            options?.summary ?? 'Thành công',
                                        detail:
                                            res?.message ??
                                            options?.successFallback ??
                                            'Thực hiện thành công'
                                    });
                                return of(success, note);
                            }
                            return of(success);
                        }),
                        catchError((error: any) => {
                            const failure = failureActionCreator({ error });
                            if (notifyOnFailure) {
                                const serverDetail =
                                    error?.error?.errors ??
                                    error?.error?.message;
                                const note =
                                    NotificationActions.showNotification({
                                        severity:
                                            options?.failureSeverity ?? 'error',
                                        summary: 'Lỗi',
                                        detail:
                                            serverDetail ??
                                            options?.failureFallback ??
                                            'Có lỗi xảy ra'
                                    });
                                return of(failure, note);
                            }
                            return of(failure);
                        })
                    )
                )
            )
        );
    }
}

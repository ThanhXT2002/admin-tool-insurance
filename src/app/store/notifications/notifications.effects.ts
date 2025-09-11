import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as NotificationActions from './notifications.actions';
import { tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Injectable()
export class NotificationEffects {
    show$: any;

    constructor(
        private actions$: Actions,
        private messageService: MessageService
    ) {
        this.show$ = createEffect(
            () =>
                this.actions$.pipe(
                    ofType(NotificationActions.showNotification),
                    tap(({ severity, summary, detail }) => {
                        this.messageService.add({ severity, summary, detail });
                    })
                ),
            { dispatch: false }
        );
    }
}

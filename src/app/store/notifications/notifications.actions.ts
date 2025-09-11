import { createAction, props } from '@ngrx/store';

export const showNotification = createAction('[Notification] Show', props<{ severity: 'success' | 'error' | 'warn' | 'info'; summary?: string; detail?: string }>());

export const clearNotifications = createAction('[Notification] Clear');

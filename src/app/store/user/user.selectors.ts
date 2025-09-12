import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUser from './user.reducer';

export const selectUserState = createFeatureSelector<fromUser.State>(fromUser.userFeatureKey);

export const selectAllUsers = createSelector(selectUserState, (s) => s.rows);
export const selectUsersTotal = createSelector(selectUserState, (s) => s.total);
export const selectUsersLoading = createSelector(selectUserState, (s) => s.loading);
export const selectUsersError = createSelector(selectUserState, (s) => s.error);
export const selectUsersLastQueryParams = createSelector(selectUserState, (s) => s.lastQueryParams ?? { page: 1, limit: 10, keyword: null, active: undefined });

export const selectSelectedUser = createSelector(selectUserState, (s) => (s as any).selected ?? null);

export const selectUserById = (id: number) => createSelector(selectUserState, (s) => s.rows.find((r) => r.id === id) ?? null);

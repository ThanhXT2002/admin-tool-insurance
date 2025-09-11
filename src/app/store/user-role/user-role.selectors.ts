import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromUserRole from './user-role.reducer';

export const selectUserRoleState = createFeatureSelector<fromUserRole.State>(fromUserRole.userRoleFeatureKey);

export const selectAllUserRoles = createSelector(selectUserRoleState, (s) => s.rows);
export const selectUserRolesTotal = createSelector(selectUserRoleState, (s) => s.total);
export const selectUserRolesLoading = createSelector(selectUserRoleState, (s) => s.loading);
export const selectUserRolesError = createSelector(selectUserRoleState, (s) => s.error);
export const selectUserRolesLastQueryParams = createSelector(selectUserRoleState, (s) => s.lastQueryParams ?? { page: 1, limit: 10, keyword: null });

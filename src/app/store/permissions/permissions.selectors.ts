import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromPermissions from './permissions.reducer';

export const selectPermissionsState = createFeatureSelector<fromPermissions.State>(fromPermissions.permissionsFeatureKey);

export const selectAllPermissions = createSelector(selectPermissionsState, (s) => s.rows);
export const selectPermissionsTotal = createSelector(selectPermissionsState, (s) => s.total);
export const selectPermissionsLoading = createSelector(selectPermissionsState, (s) => s.loading);
export const selectPermissionsError = createSelector(selectPermissionsState, (s) => s.error);
export const selectPermissionsLastQueryParams = createSelector(selectPermissionsState, (s) => s.lastQueryParams ?? { page: 1, limit: 10, keyword: null });

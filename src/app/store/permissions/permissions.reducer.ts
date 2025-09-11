import { createReducer, on } from '@ngrx/store';
import * as PermissionsActions from './permissions.actions';
import { Permission } from '@/interfaces/permission.interface';

export const permissionsFeatureKey = 'permissions';

export interface State {
    rows: Permission[];
    total: number;
    loading: boolean;
    error: any | null;
    lastQueryParams?: { page?: number; limit?: number; keyword?: string | null } | null;
}

export const initialState: State = {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    lastQueryParams: null
};

export const reducer = createReducer(
    initialState,
    on(PermissionsActions.loadPermissions, (state, { page, limit, keyword }) => ({
        ...state,
        loading: true,
        error: null,
        lastQueryParams: { page: page ?? state.lastQueryParams?.page, limit: limit ?? state.lastQueryParams?.limit, keyword: keyword ?? state.lastQueryParams?.keyword }
    })),
    on(PermissionsActions.loadPermissionsSuccess, (state, { rows, total }) => ({ ...state, rows, total, loading: false })),
    on(PermissionsActions.loadPermissionsFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(PermissionsActions.createPermission, (state) => ({ ...state, loading: true })),
    on(PermissionsActions.createPermissionSuccess, (state, { item }) => ({ ...state, rows: [item, ...state.rows], total: state.total + 1, loading: false })),
    on(PermissionsActions.createPermissionFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(PermissionsActions.updatePermission, (state) => ({ ...state, loading: true })),
    on(PermissionsActions.updatePermissionSuccess, (state, { item }) => ({
        ...state,
        rows: state.rows.map((r) => (r.id === item.id ? item : r)),
        loading: false
    })),
    on(PermissionsActions.updatePermissionFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(PermissionsActions.deletePermission, (state) => ({ ...state, loading: true })),
    on(PermissionsActions.deletePermissionSuccess, (state, { id }) => ({
        ...state,
        rows: state.rows.filter((r) => r.id !== id),
        total: Math.max(0, state.total - 1),
        loading: false
    })),
    on(PermissionsActions.deletePermissionFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

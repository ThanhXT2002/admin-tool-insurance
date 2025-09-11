import { createReducer, on } from '@ngrx/store';
import * as UserRoleActions from './user-role.actions';
import { PaginatedState } from '@/interfaces/paginated-state.interface';
import { userRole } from '@/pages/service/user-role.service';

export const userRoleFeatureKey = 'userRole';

export type State = PaginatedState<userRole>;

export const initialState: State = {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    lastQueryParams: null
};

export const reducer = createReducer(
    initialState,
    on(UserRoleActions.loadUserRoles, (state, { page, limit, keyword }) => ({
        ...state,
        loading: true,
        error: null,
        lastQueryParams: { page: page ?? state.lastQueryParams?.page, limit: limit ?? state.lastQueryParams?.limit, keyword: keyword ?? state.lastQueryParams?.keyword }
    })),
    on(UserRoleActions.loadUserRolesSuccess, (state, { rows, total }) => ({ ...state, rows, total, loading: false })),
    on(UserRoleActions.loadUserRolesFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserRoleActions.createUserRole, (state) => ({ ...state, loading: true })),
    on(UserRoleActions.createUserRoleSuccess, (state, { item }) => ({ ...state, rows: [item, ...state.rows], total: state.total + 1, loading: false })),
    on(UserRoleActions.createUserRoleFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserRoleActions.updateUserRole, (state) => ({ ...state, loading: true })),
    on(UserRoleActions.updateUserRoleSuccess, (state, { item }) => ({ ...state, rows: state.rows.map((r) => (r.id === item.id ? item : r)), loading: false })),
    on(UserRoleActions.updateUserRoleFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserRoleActions.deleteUserRole, (state) => ({ ...state, loading: true })),
    on(UserRoleActions.deleteUserRoleSuccess, (state, { id }) => ({ ...state, rows: state.rows.filter((r) => r.id !== id), total: Math.max(0, state.total - 1), loading: false })),
    on(UserRoleActions.deleteUserRoleFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

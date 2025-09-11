import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { PaginatedState } from '@/interfaces/paginated-state.interface';
import { User } from '@/pages/service/user.service';

export const userFeatureKey = 'user';

export type State = PaginatedState<User>;

export const initialState: State = {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    lastQueryParams: null
};

export const reducer = createReducer(
    initialState,
    on(UserActions.loadUsers, (state, { page, limit, keyword }) => ({
        ...state,
        loading: true,
        error: null,
        lastQueryParams: { page: page ?? state.lastQueryParams?.page, limit: limit ?? state.lastQueryParams?.limit, keyword: keyword ?? state.lastQueryParams?.keyword }
    })),
    on(UserActions.loadUsersSuccess, (state, { rows, total }) => ({ ...state, rows, total, loading: false })),
    on(UserActions.loadUsersFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserActions.createUser, (state) => ({ ...state, loading: true })),
    on(UserActions.createUserSuccess, (state, { item }) => ({ ...state, rows: [item, ...state.rows], total: state.total + 1, loading: false })),
    on(UserActions.createUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserActions.updateUser, (state) => ({ ...state, loading: true })),
    on(UserActions.updateUserSuccess, (state, { item }) => ({ ...state, rows: state.rows.map((r) => (r.id === item.id ? item : r)), loading: false })),
    on(UserActions.updateUserFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(UserActions.deleteUser, (state) => ({ ...state, loading: true })),
    on(UserActions.deleteUserSuccess, (state, { id }) => ({ ...state, rows: state.rows.filter((r) => r.id !== id), total: Math.max(0, state.total - 1), loading: false })),
    on(UserActions.deleteUserFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

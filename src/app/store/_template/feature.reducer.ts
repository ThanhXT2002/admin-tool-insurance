import { createReducer, on } from '@ngrx/store';
import * as FeatureActions from './feature.actions';
import { PaginatedState } from '@/interfaces/paginated-state.interface';

export const featureFeatureKey = 'feature';

export type State = PaginatedState<any>;

export const initialState: State = {
    rows: [],
    total: 0,
    loading: false,
    error: null,
    lastQueryParams: null
};

export const reducer = createReducer(
    initialState,
    on(FeatureActions.loadFeature, (state, { page, limit, keyword }) => ({
        ...state,
        loading: true,
        error: null,
        lastQueryParams: { page: page ?? state.lastQueryParams?.page, limit: limit ?? state.lastQueryParams?.limit, keyword: keyword ?? state.lastQueryParams?.keyword }
    })),

    on(FeatureActions.loadFeatureSuccess, (state, { rows, total }) => ({ ...state, rows, total, loading: false })),
    on(FeatureActions.loadFeatureFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(FeatureActions.createFeature, (state) => ({ ...state, loading: true })),
    on(FeatureActions.createFeatureSuccess, (state, { item }) => ({ ...state, rows: [item, ...state.rows], total: state.total + 1, loading: false })),
    on(FeatureActions.createFeatureFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(FeatureActions.updateFeature, (state) => ({ ...state, loading: true })),
    on(FeatureActions.updateFeatureSuccess, (state, { item }) => ({ ...state, rows: state.rows.map((r) => (r.id === item.id ? item : r)), loading: false })),
    on(FeatureActions.updateFeatureFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(FeatureActions.deleteFeature, (state) => ({ ...state, loading: true })),
    on(FeatureActions.deleteFeatureSuccess, (state, { id }) => ({ ...state, rows: state.rows.filter((r) => r.id !== id), total: Math.max(0, state.total - 1), loading: false })),
    on(FeatureActions.deleteFeatureFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

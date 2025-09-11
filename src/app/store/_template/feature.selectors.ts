import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromFeature from './feature.reducer';

export const selectFeatureState = createFeatureSelector<fromFeature.State>(fromFeature.featureFeatureKey);

export const selectAllFeature = createSelector(selectFeatureState, (s) => s.rows);
export const selectFeatureTotal = createSelector(selectFeatureState, (s) => s.total);
export const selectFeatureLoading = createSelector(selectFeatureState, (s) => s.loading);
export const selectFeatureError = createSelector(selectFeatureState, (s) => s.error);
export const selectFeatureLastQueryParams = createSelector(selectFeatureState, (s) => s.lastQueryParams ?? { page: 1, limit: 10, keyword: null });

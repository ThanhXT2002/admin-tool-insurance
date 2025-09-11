import { createAction, props } from '@ngrx/store';

// Replace Feature and types when creating a new feature
export const loadFeature = createAction('[Feature] Load', props<{ page?: number; limit?: number; keyword?: string }>());
export const loadFeatureSuccess = createAction('[Feature] Load Success', props<{ rows: any[]; total: number }>());
export const loadFeatureFailure = createAction('[Feature] Load Failure', props<{ error: any }>());

export const createFeature = createAction('[Feature] Create', props<{ data: any }>());
// include optional message from server
export const createFeatureSuccess = createAction('[Feature] Create Success', props<{ item: any; message?: string }>());
export const createFeatureFailure = createAction('[Feature] Create Failure', props<{ error: any }>());

export const updateFeature = createAction('[Feature] Update', props<{ id: number; data: any }>());
export const updateFeatureSuccess = createAction('[Feature] Update Success', props<{ item: any; message?: string }>());
export const updateFeatureFailure = createAction('[Feature] Update Failure', props<{ error: any }>());

export const deleteFeature = createAction('[Feature] Delete', props<{ id: number }>());
export const deleteFeatureSuccess = createAction('[Feature] Delete Success', props<{ id: number; message?: string }>());
export const deleteFeatureFailure = createAction('[Feature] Delete Failure', props<{ error: any }>());

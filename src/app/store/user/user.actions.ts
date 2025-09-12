import { createAction, props } from '@ngrx/store';
import { User } from '@/pages/service/user.service';

// Actions for user feature (danh sách người dùng) - pagination + CRUD
export const loadUsers = createAction('[User] Load', props<{ page?: number; limit?: number; keyword?: string; active?: boolean }>());
export const loadUsersSuccess = createAction('[User] Load Success', props<{ rows: User[]; total: number }>());
export const loadUsersFailure = createAction('[User] Load Failure', props<{ error: any }>());

export const createUser = createAction('[User] Create', props<{ data: any }>());
export const createUserSuccess = createAction('[User] Create Success', props<{ item: User; message?: string }>());
export const createUserFailure = createAction('[User] Create Failure', props<{ error: any }>());

export const updateUser = createAction('[User] Update', props<{ id: number; data: any }>());
export const updateUserSuccess = createAction('[User] Update Success', props<{ item: User; message?: string }>());
export const updateUserFailure = createAction('[User] Update Failure', props<{ error: any }>());

export const deleteUser = createAction('[User] Delete', props<{ id: number }>());
export const deleteUserSuccess = createAction('[User] Delete Success', props<{ id: number; message?: string }>());
export const deleteUserFailure = createAction('[User] Delete Failure', props<{ error: any }>());

// Single user fetch
export const loadUser = createAction('[User] Load By Id', props<{ id: number }>());
export const loadUserSuccess = createAction('[User] Load By Id Success', props<{ item: User }>());
export const loadUserFailure = createAction('[User] Load By Id Failure', props<{ error: any }>());

// Bulk operations
export const deleteUsers = createAction('[User] Delete Multiple', props<{ ids: number[] }>());
export const deleteUsersSuccess = createAction('[User] Delete Multiple Success', props<{ ids: number[]; message?: string }>());
export const deleteUsersFailure = createAction('[User] Delete Multiple Failure', props<{ error: any }>());

export const activeUsers = createAction('[User] Active Multiple', props<{ ids: number[]; active: boolean }>());
export const activeUsersSuccess = createAction('[User] Active Multiple Success', props<{ ids: number[]; active: boolean; message?: string }>());
export const activeUsersFailure = createAction('[User] Active Multiple Failure', props<{ error: any }>());

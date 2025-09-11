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

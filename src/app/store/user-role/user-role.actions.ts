import { createAction, props } from '@ngrx/store';
import { userRole } from '@/pages/service/user-role.service';

export const loadUserRoles = createAction('[UserRole] Load', props<{ page?: number; limit?: number; keyword?: string }>());
export const loadUserRolesSuccess = createAction('[UserRole] Load Success', props<{ rows: userRole[]; total: number }>());
export const loadUserRolesFailure = createAction('[UserRole] Load Failure', props<{ error: any }>());

export const createUserRole = createAction('[UserRole] Create', props<{ data: any }>());
export const createUserRoleSuccess = createAction('[UserRole] Create Success', props<{ item: userRole; message?: string }>());
export const createUserRoleFailure = createAction('[UserRole] Create Failure', props<{ error: any }>());

export const updateUserRole = createAction('[UserRole] Update', props<{ id: number; data: any }>());
export const updateUserRoleSuccess = createAction('[UserRole] Update Success', props<{ item: userRole; message?: string }>());
export const updateUserRoleFailure = createAction('[UserRole] Update Failure', props<{ error: any }>());

export const deleteUserRole = createAction('[UserRole] Delete', props<{ id: number }>());
export const deleteUserRoleSuccess = createAction('[UserRole] Delete Success', props<{ id: number; message?: string }>());
export const deleteUserRoleFailure = createAction('[UserRole] Delete Failure', props<{ error: any }>());

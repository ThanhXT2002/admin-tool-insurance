import { createAction, props } from '@ngrx/store';
import { Permission } from '@/interfaces/permission.interface';

export const loadPermissions = createAction('[Permissions] Load', props<{ page?: number; limit?: number; keyword?: string }>());

export const loadPermissionsSuccess = createAction('[Permissions] Load Success', props<{ rows: Permission[]; total: number }>());

export const loadPermissionsFailure = createAction('[Permissions] Load Failure', props<{ error: any }>());

export const createPermission = createAction('[Permissions] Create', props<{ data: { key: string; name: string; description?: string } }>());
export const createPermissionSuccess = createAction('[Permissions] Create Success', props<{ item: Permission; message?: string }>());
export const createPermissionFailure = createAction('[Permissions] Create Failure', props<{ error: any }>());

export const updatePermission = createAction('[Permissions] Update', props<{ id: number; data: { key?: string; name?: string; description?: string } }>());
export const updatePermissionSuccess = createAction('[Permissions] Update Success', props<{ item: Permission; message?: string }>());
export const updatePermissionFailure = createAction('[Permissions] Update Failure', props<{ error: any }>());

export const deletePermission = createAction('[Permissions] Delete', props<{ id: number }>());
export const deletePermissionSuccess = createAction('[Permissions] Delete Success', props<{ id: number; message?: string }>());
export const deletePermissionFailure = createAction('[Permissions] Delete Failure', props<{ error: any }>());

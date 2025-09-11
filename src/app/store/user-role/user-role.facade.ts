import { Injectable, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import * as UserRoleSelectors from './user-role.selectors';
import * as UserRoleActions from './user-role.actions';
import { Subscription } from 'rxjs';
import { userRole } from '@/pages/service/user-role.service';

export interface IUserRoleFacade {
    roles: WritableSignal<userRole[]>;
    total: WritableSignal<number>;
    loading: WritableSignal<boolean>;
    error: WritableSignal<any | null>;
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null } | null>;
    load(params?: { page?: number; limit?: number; keyword?: string }): void;
    create(data: any): void;
    update(id: number, data: any): void;
    delete(id: number): void;
    destroy?(): void;
}

@Injectable({ providedIn: 'root' })
export class UserRoleFacade implements IUserRoleFacade {
    private subs = new Subscription();

    roles: WritableSignal<userRole[]> = signal<userRole[]>([]);
    total: WritableSignal<number> = signal<number>(0);
    loading: WritableSignal<boolean> = signal<boolean>(false);
    error: WritableSignal<any | null> = signal<any | null>(null);
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null } | null> = signal<{ page?: number; limit?: number; keyword?: string | null } | null>(null);

    constructor(private store: Store) {
        this.subs.add(this.store.select(UserRoleSelectors.selectAllUserRoles).subscribe((v: userRole[] | null | undefined) => this.roles.set(v ?? [])));
        this.subs.add(this.store.select(UserRoleSelectors.selectUserRolesTotal).subscribe((v: number | null | undefined) => this.total.set(v ?? 0)));
        this.subs.add(this.store.select(UserRoleSelectors.selectUserRolesLoading).subscribe((v: boolean | null | undefined) => this.loading.set(!!v)));
        this.subs.add(this.store.select(UserRoleSelectors.selectUserRolesError).subscribe((v: any) => this.error.set(v ?? null)));
        this.subs.add(this.store.select(UserRoleSelectors.selectUserRolesLastQueryParams).subscribe((v: any) => this.lastQueryParams.set(v ?? null)));
    }

    destroy() {
        this.subs.unsubscribe();
    }

    load(params?: { page?: number; limit?: number; keyword?: string }) {
        this.store.dispatch(UserRoleActions.loadUserRoles({ ...params }));
    }

    create(data: any) {
        this.store.dispatch(UserRoleActions.createUserRole({ data }));
    }

    update(id: number, data: any) {
        this.store.dispatch(UserRoleActions.updateUserRole({ id, data }));
    }

    delete(id: number) {
        this.store.dispatch(UserRoleActions.deleteUserRole({ id }));
    }
}

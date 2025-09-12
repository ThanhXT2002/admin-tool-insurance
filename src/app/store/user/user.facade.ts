import { Injectable, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import * as UserSelectors from './user.selectors';
import * as UserActions from './user.actions';
import { Subscription } from 'rxjs';
import { User } from '@/pages/service/user.service';

export interface IUserFacade {
    users: WritableSignal<User[]>;
    total: WritableSignal<number>;
    loading: WritableSignal<boolean>;
    error: WritableSignal<any | null>;
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null; active?: boolean } | null>;
    load(params?: { page?: number; limit?: number; keyword?: string; active?: boolean }): void;
    create(data: any): void;
    update(id: number, data: any): void;
    delete(id: number): void;
    destroy?(): void;
}

@Injectable({ providedIn: 'root' })
export class UserFacade implements IUserFacade {
    private subs = new Subscription();

    users: WritableSignal<User[]> = signal<User[]>([]);
    total: WritableSignal<number> = signal<number>(0);
    loading: WritableSignal<boolean> = signal<boolean>(false);
    error: WritableSignal<any | null> = signal<any | null>(null);
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null; active?: boolean } | null> = signal<{ page?: number; limit?: number; keyword?: string | null; active?: boolean } | null>(null);
    selected: WritableSignal<User | null> = signal<User | null>(null);

    constructor(private store: Store) {
        this.subs.add(this.store.select(UserSelectors.selectAllUsers).subscribe((v: User[] | null | undefined) => this.users.set(v ?? [])));
        this.subs.add(this.store.select(UserSelectors.selectUsersTotal).subscribe((v: number | null | undefined) => this.total.set(v ?? 0)));
        this.subs.add(this.store.select(UserSelectors.selectUsersLoading).subscribe((v: boolean | null | undefined) => this.loading.set(!!v)));
        this.subs.add(this.store.select(UserSelectors.selectUsersError).subscribe((v: any) => this.error.set(v ?? null)));
        this.subs.add(this.store.select(UserSelectors.selectUsersLastQueryParams).subscribe((v: any) => this.lastQueryParams.set(v ?? null)));
        this.subs.add(this.store.select(UserSelectors.selectSelectedUser).subscribe((v: User | null | undefined) => this.selected.set(v ?? null)));
    }

    destroy() {
        this.subs.unsubscribe();
    }

    load(params?: { page?: number; limit?: number; keyword?: string; active?: boolean }) {
        this.store.dispatch(UserActions.loadUsers({ ...params }));
    }

    create(data: any) {
        this.store.dispatch(UserActions.createUser({ data }));
    }

    update(id: number, data: any) {
        this.store.dispatch(UserActions.updateUser({ id, data }));
    }

    delete(id: number) {
        this.store.dispatch(UserActions.deleteUser({ id }));
    }

    loadById(id: number) {
        this.store.dispatch(UserActions.loadUser({ id }));
    }

    deleteMultiple(ids: number[]) {
        this.store.dispatch(UserActions.deleteUsers({ ids }));
    }

    activeMultiple(ids: number[], active: boolean) {
        this.store.dispatch(UserActions.activeUsers({ ids, active }));
    }
}

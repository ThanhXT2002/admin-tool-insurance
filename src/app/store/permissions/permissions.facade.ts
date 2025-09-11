import { Injectable, signal, Signal, OnDestroy, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import * as PermissionsSelectors from './permissions.selectors';
import * as PermissionsActions from './permissions.actions';
import { Subscription } from 'rxjs';
import { Permission } from '@/interfaces/permission.interface';

export interface IPermissionsFacade {
    permissions: Signal<Permission[]>;
    total: Signal<number>;
    loading: Signal<boolean>;
    error: Signal<any | null>;
    load(params?: { page?: number; limit?: number; keyword?: string }): void;
    create(data: { key: string; name: string; description?: string }): void;
    update(id: number, data: { key?: string; name?: string; description?: string }): void;
    delete(id: number): void;
    destroy?(): void;
}

@Injectable({ providedIn: 'root' })
export class PermissionsFacade implements IPermissionsFacade, OnDestroy {
    private subs = new Subscription();

    // use WritableSignal internally so we can .set(...) the values
    permissions: WritableSignal<Permission[]> = signal<Permission[]>([]);
    total: WritableSignal<number> = signal<number>(0);
    loading: WritableSignal<boolean> = signal<boolean>(false);
    error: WritableSignal<any | null> = signal<any | null>(null);
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null } | null> = signal<{ page?: number; limit?: number; keyword?: string | null } | null>(null);

    constructor(private store: Store) {
        // subscribe to selectors and update signals
        this.subs.add(this.store.select(PermissionsSelectors.selectAllPermissions).subscribe((v: Permission[] | null | undefined) => this.permissions.set(v ?? [])));
        this.subs.add(this.store.select(PermissionsSelectors.selectPermissionsTotal).subscribe((v: number | null | undefined) => this.total.set(v ?? 0)));
        this.subs.add(this.store.select(PermissionsSelectors.selectPermissionsLoading).subscribe((v: boolean | null | undefined) => this.loading.set(!!v)));
        this.subs.add(this.store.select(PermissionsSelectors.selectPermissionsError).subscribe((v: any) => this.error.set(v ?? null)));
        this.subs.add(this.store.select(PermissionsSelectors.selectPermissionsLastQueryParams).subscribe((v: any) => this.lastQueryParams.set(v ?? null)));
    }

    ngOnDestroy(): void {
        this.destroy();
    }

    destroy() {
        this.subs.unsubscribe();
    }

    load(params?: { page?: number; limit?: number; keyword?: string }) {
        this.store.dispatch(PermissionsActions.loadPermissions({ ...params }));
    }

    create(data: { key: string; name: string; description?: string }) {
        this.store.dispatch(PermissionsActions.createPermission({ data }));
    }

    update(id: number, data: { key?: string; name?: string; description?: string }) {
        this.store.dispatch(PermissionsActions.updatePermission({ id, data }));
    }

    delete(id: number) {
        this.store.dispatch(PermissionsActions.deletePermission({ id }));
    }
}

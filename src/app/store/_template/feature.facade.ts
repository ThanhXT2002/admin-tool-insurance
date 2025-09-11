import { Injectable, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import * as FeatureSelectors from './feature.selectors';
import * as FeatureActions from './feature.actions';
import { Subscription } from 'rxjs';
import { PaginatedState } from '@/interfaces/paginated-state.interface';

@Injectable({ providedIn: 'root' })
export class FeatureFacade<T = any> {
    private subs = new Subscription();

    // typed signals (T = entity type)
    items: WritableSignal<T[]> = signal<T[]>([]);
    total: WritableSignal<number> = signal<number>(0);
    loading: WritableSignal<boolean> = signal<boolean>(false);
    error: WritableSignal<any | null> = signal<any | null>(null);
    lastQueryParams: WritableSignal<{ page?: number; limit?: number; keyword?: string | null } | null> = signal(null);

    constructor(private store: Store) {
        this.subs.add(this.store.select(FeatureSelectors.selectAllFeature).subscribe((v) => this.items.set(v ?? [])));
        this.subs.add(this.store.select(FeatureSelectors.selectFeatureTotal).subscribe((v) => this.total.set(v ?? 0)));
        this.subs.add(this.store.select(FeatureSelectors.selectFeatureLoading).subscribe((v) => this.loading.set(!!v)));
        this.subs.add(this.store.select(FeatureSelectors.selectFeatureError).subscribe((v) => this.error.set(v ?? null)));
        this.subs.add(this.store.select(FeatureSelectors.selectFeatureLastQueryParams).subscribe((v) => this.lastQueryParams.set(v ?? null)));
    }

    load(params?: { page?: number; limit?: number; keyword?: string }) {
        this.store.dispatch(FeatureActions.loadFeature({ ...params }));
    }
    create(data: T) {
        this.store.dispatch(FeatureActions.createFeature({ data }));
    }
    update(id: number, data: T) {
        this.store.dispatch(FeatureActions.updateFeature({ id, data }));
    }
    delete(id: number) {
        this.store.dispatch(FeatureActions.deleteFeature({ id }));
    }

    destroy() {
        this.subs.unsubscribe();
    }
}

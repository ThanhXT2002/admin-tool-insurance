import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject,
    effect,
    WritableSignal,
    signal,
    computed,
    ChangeDetectionStrategy
} from '@angular/core';
import { ContactStore } from '@/store/contact/contact.store';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [
    TableModule,
    CommonModule,
    DialogModule,
    IconField,
    InputIcon,
    InputTextModule,
    FormsModule,
    Button
],
    templateUrl: './contact.html',
    styleUrl: './contact.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contact implements OnInit, OnDestroy {
    /** Store feature Contact */
    contactStore = inject(ContactStore);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    /** Signals exposed to template */
    rows = this.contactStore.rows;
    total = this.contactStore.total;

    /** Local UI signals */
    loading: WritableSignal<boolean> = signal(false);
    page: WritableSignal<number> = signal(1);
    limit: WritableSignal<number> = signal(10);
    currentKeyword: WritableSignal<string | undefined> = signal(undefined);

    @ViewChild('dt') dt!: Table;

    private destroy$ = new Subject<void>();
    private skipLazyLoads = 0;
    private searchTimeout: any;

    // dialog detail
    showDetail = false;
    detailItem: any = null;

    private _rowsEffect = effect(() => {
        // Khi rows thay đổi, dừng loading local
        const _ = this.contactStore.rows();
        this.loading.set(false);
    });

    ngOnInit(): void {
        const queryParams = this.route.snapshot.queryParams;
        this.page.set(Number(queryParams['page']) || 1);
        this.limit.set(Number(queryParams['limit']) || 10);
        this.currentKeyword.set(queryParams['keyword'] || undefined);

        // Hydrate store từ query params (nếu có)
        this.skipLazyLoads += 1;
        const parsed =
            this.contactStore.hydrateFromQueryParams(
                this.route.snapshot.queryParams as any
            ) || {};

        this.page.set(parsed.page ?? this.page());
        this.limit.set(parsed.limit ?? this.limit());
        this.currentKeyword.set(parsed.keyword ?? this.currentKeyword());

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.applyParams(params);
            });

        // Nếu hydrate không load data thì trigger load
        if (!parsed || Object.keys(parsed).length === 0) {
            const hasExistingData = this.contactStore.rows().length > 0;
            if (!hasExistingData) {
                this.loadData();
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
        try {
            if (typeof (this as any)._rowsEffect === 'function')
                (this as any)._rowsEffect();
        } catch (_) {}
    }

    /** Xử lý input tìm kiếm global */
    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

    /**
     * Debounce tìm kiếm rồi cập nhật query params
     */
    triggerSearch(keyword: string) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const currentParams = this.route.snapshot.queryParams;
            const currentKeyword = currentParams['keyword'] || '';
            const currentPage = Number(currentParams['page']) || 1;

            const shouldResetPage = currentKeyword !== keyword;
            const targetPage = shouldResetPage ? 1 : currentPage;

            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                    page: targetPage,
                    limit: this.limit(),
                    keyword: keyword || null
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
        }, 350);
    }

    /** Gọi store để load dữ liệu với params hiện tại */
    loadData(keyword?: string) {
        this.loading.set(true);

        const params: any = {
            page: this.page(),
            limit: this.limit(),
            keyword: keyword ?? this.currentKeyword()
        };

        this.contactStore.load(params).finally(() => {
            this.loading.set(false);
        });
    }

    onLazyLoad(event: any) {
        if (this.skipLazyLoads > 0) {
            this.skipLazyLoads -= 1;
            return;
        }

        const first = Number(event.first) || 0;
        const rows = Number(event.rows) || this.limit();
        const newPage = Math.floor(first / rows) + 1;
        this.page.set(newPage);
        this.limit.set(rows);
        this.loading.set(true);
        this.loadData(this.currentKeyword());
    }

    private applyParams(params: any) {
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        const pageChanged = this.page() !== newPage;
        const limitChanged = this.limit() !== newLimit;
        const keywordChanged = this.currentKeyword() !== newKeyword;

        this.page.set(newPage);
        this.limit.set(newLimit);
        this.currentKeyword.set(newKeyword);

        if (pageChanged || limitChanged || keywordChanged) {
            this.loadData(this.currentKeyword());
        }
    }

    // open detail
    viewItem(item: any) {
        this.detailItem = item;
        this.showDetail = true;
    }

    closeDetail() {
        this.detailItem = null;
        this.showDetail = false;
    }
}

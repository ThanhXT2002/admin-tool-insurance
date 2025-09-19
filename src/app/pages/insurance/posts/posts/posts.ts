import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject,
    signal,
    effect
} from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { PostCategoryFacade } from '@/store/postCategory/postCategory.facade';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RefreshService } from '@/pages/service/refresh.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { PostCategoryForm } from '../post-category-form/post-category-form';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PostCategory } from '@/interfaces/post-category.interface';
import { PostStore } from '@/store/post/post.store';

@Component({
    selector: 'app-posts',
    imports: [
        Button,
        TableModule,
        IconField,
        InputIcon,
        InputTextModule,
        ConfirmDialog,
        FormsModule,
        Select
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './posts.html',
    styleUrl: './posts.scss'
})
export class Posts implements OnInit, OnDestroy {
    postStore = inject(PostStore);
    private refreshService = inject(RefreshService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    items = signal<PostCategory[]>([]);
    totalRecords = 0;
    loading = false;
    selectedItems!: PostCategory[] | null;



    page = 1;
    limit = 10;
    active: boolean | undefined = undefined;
    currentKeyword: string | undefined = undefined;
    @ViewChild('dt') dt!: Table;

    private destroy$ = new Subject<void>();
    private skipNextLazyLoad = false;
    private searchTimeout: any;

    showForm = false;
    isEditing = false;
    selectedItem: PostCategory | null = null;

    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: 'PUBLISHED' },
        { name: 'Đã lưu trữ', code: 'ARCHIVED' },
        { name: 'Bản nháp', code: 'DRAFT' }
    ];

    selectedStatus = this.statusOptions[0];

    private applyParams(params: any) {
        clearTimeout(this.searchTimeout);

        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        // let newActive: boolean | undefined = undefined;
        // if (params['active'] === 'true') {
        //     newActive = true;
        // } else if (params['active'] === 'false') {
        //     newActive = false;
        // }

        // const pageChanged = this.page !== newPage;
        // const limitChanged = this.limit !== newLimit;
        // const keywordChanged = this.currentKeyword !== newKeyword;
        // const activeChanged = this.active !== newActive;

        // this.page = newPage;
        // this.limit = newLimit;
        // this.currentKeyword = newKeyword;
        // this.active = newActive;

        // this.selectedStatus =
        //     this.statusOptions.find((opt) => opt.code === newActive) ||
        //     this.statusOptions[0];

        // if (pageChanged || limitChanged || keywordChanged || activeChanged) {
        //     this.skipNextLazyLoad = true;
        //     setTimeout(() => (this.skipNextLazyLoad = false), 250);
        //     this.loadData(newKeyword);
        // }
    }

    ngOnInit() {
        const queryParams = this.route.snapshot.queryParams;
        this.page = Number(queryParams['page']) || 1;
        this.limit = Number(queryParams['limit']) || 10;
        this.currentKeyword = queryParams['keyword'] || undefined;

        if (queryParams['active'] === 'true') {
            this.active = true;
        } else if (queryParams['active'] === 'false') {
            this.active = false;
        } else {
            this.active = undefined;
        }

        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];


        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.applyParams(params);
            });

        this.refreshService.refresh$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                const currentParams = this.route.snapshot.queryParams;
                const keyword = currentParams['keyword'] || undefined;
                this.loadData(keyword);
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        clearTimeout(this.searchTimeout);
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.triggerSearch(value);
    }

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
                    limit: this.limit,
                    keyword: keyword || null,
                    active: this.active !== undefined ? this.active : null
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
            });
        }, 350);
    }

    loadData(keyword?: string) {
        this.loading = true;
        this.postStore.load({

        });
    }

    onLazyLoad(event: any) {
        if (this.skipNextLazyLoad) return;


    }

    openNew() {
        this.router.navigate(['/insurance/post/create']);
    }

    editItem(id: number) {
        this.router.navigate(['/insurance/post-category/update', id]);
    }


    deleteItem(item: PostCategory) {
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa danh mục này?',
            header: 'Xóa danh mục',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: () => this.postStore.delete(item.id),
            reject: () =>
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác'
                })
        });
    }

    changeStatus() {

    }

    deleteMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        this.confirmationService.confirm({
            message: 'Bạn có chắc muốn xóa những danh mục đã chọn?',
            header: 'Xóa nhiều danh mục',
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Hủy',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: { label: 'Xóa', severity: 'danger' },
            accept: () => {
                const ids = this.selectedItems!.map((i) => i.id);

                this.postStore.deleteMultiple(ids);
                // keep selectedItems cleared in UI for now
                this.selectedItems = null;
            },
            reject: () =>
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Đã hủy',
                    detail: 'Bạn đã hủy thao tác xóa'
                })
        });
    }

    activeMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);

        this.selectedItems = null;
    }

    inactiveMultiple() {
        if (!this.selectedItems || this.selectedItems.length === 0) return;
        const ids = this.selectedItems.map((i) => i.id);

        this.selectedItems = null;
    }

    toggleChangeStatus(item: PostCategory) {
        if (!item) return;
        const newStatus = !item.active;

    }

    errorImg(event: Event) {
        const target = event?.target as HTMLImageElement | null;
        if (!target) return;
        const fallback = 'assets/images/np-img.webp';
        if (target.src && !target.src.endsWith(fallback)) target.src = fallback;
    }
}

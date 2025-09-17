import {
    ChangeDetectorRef,
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    inject
} from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TreeTableModule, TreeTable } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    PostCategoryService,
    PostCategory
} from '@/pages/service/post-category.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-nested-post-cate',
    templateUrl: './nested-post-cate.html',
    styleUrl: './nested-post-cate.scss',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TreeTableModule,
        ButtonModule,
        InputTextModule,
        ConfirmDialog,
        IconField,
        InputIcon,
        Select,
        ToggleSwitch
    ],
    providers: [ConfirmationService, MessageService]
})
export class NestedPostCate implements OnInit, OnDestroy {
    private service = inject(PostCategoryService);
    private confirmation = inject(ConfirmationService);
    private message = inject(MessageService);
    private cd = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    files: TreeNode[] = [];
    cols: Column[] = [
        { field: 'name', header: 'Tên' },
        { field: 'description', header: 'Mô tả' },
        { field: 'active', header: 'Trạng thái' },
        { field: 'actions', header: 'Thao tác' }
    ];

    // Selection state: store selected node data objects
    selectedNodes: any[] | null = null;

    page = 1;
    limit = 10;
    keyword?: string | null = null;
    active: boolean | undefined = undefined;

    // For UI status select
    statusOptions = [
        { name: 'Tất cả trạng thái', code: undefined },
        { name: 'Đang hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    selectedStatus = this.statusOptions[0];

    loading = false;

    private destroy$ = new Subject<void>();

    @ViewChild('tt') tt!: TreeTable;

    ngOnInit() {
        const qp = this.route.snapshot.queryParams;
        this.page = Number(qp['page']) || 1;
        this.limit = Number(qp['limit']) || 10;
        this.keyword = qp['keyword'] || undefined;
        if (qp['active'] === 'true') this.active = true;
        else if (qp['active'] === 'false') this.active = false;
        else this.active = undefined;

        // Sync selectedStatus with active query param
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        this.loadData();

        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((p) => {
            this.applyParams(p);
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private applyParams(params: any) {
        const newPage = Number(params['page']) || 1;
        const newLimit = Number(params['limit']) || 10;
        const newKeyword = params['keyword'] || undefined;

        let newActive: boolean | undefined = undefined;
        if (params['active'] === 'true') newActive = true;
        else if (params['active'] === 'false') newActive = false;

        const changed =
            newPage !== this.page ||
            newLimit !== this.limit ||
            newKeyword !== this.keyword ||
            newActive !== this.active;
        this.page = newPage;
        this.limit = newLimit;
        this.keyword = newKeyword;
        this.active = newActive;

        // Sync selectedStatus when params change
        this.selectedStatus =
            this.statusOptions.find((opt) => opt.code === this.active) ||
            this.statusOptions[0];

        if (changed) this.loadData();
    }

    async loadData() {
        this.loading = true;
        try {
            const params: any = {
                page: this.page,
                limit: this.limit
            };
            if (this.keyword) params.keyword = this.keyword;
            if (this.active !== undefined) params.active = String(this.active);

            const resp = await firstValueFrom(this.service.getNested(params));
            const data = resp?.data ?? null;
            if (!data) {
                this.files = [];
                return;
            }

            // Convert PostCategory[] (root list) to TreeNode[] expected by PrimeNG
            const toTreeNodes = (items: PostCategory[]): TreeNode[] => {
                return items.map((it) => ({
                    data: {
                        id: it.id,
                        name: it.name,
                        description: it.description,
                        order: it.order,
                        active: it.active
                    },
                    children:
                        it.children && it.children.length > 0
                            ? toTreeNodes(it.children)
                            : undefined
                }));
            };

            this.files = toTreeNodes(Array.isArray(data) ? data : []);
            this.cd.markForCheck();
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    // Walk tree and collect ids of node and its descendants
    private collectIds(node: any, out: number[]) {
        if (!node) return;
        // node can be TreeNode (has data) or plain data
        const id = node?.data?.id ?? node?.id;
        if (typeof id === 'number') out.push(id);
        const children = node?.children ?? node?.children;
        if (children && children.length) {
            children.forEach((c: any) => this.collectIds(c, out));
        }
    }

    // When selection changes in the TreeTable, we get item objects.
    onSelectionChange(selection: any[]) {
        this.selectedNodes = selection || null;
    }

    handleSelectionChange(ev: any) {
        // TreeTable may emit single node or array; normalize to array
        if (!ev) return this.onSelectionChange([]);
        if (Array.isArray(ev)) return this.onSelectionChange(ev as any[]);
        // when single node selected, TreeTable may emit object with data
        return this.onSelectionChange([ev]);
    }

    // Helper to get all selected ids (including children when a parent selected)
    private getSelectedIds(): number[] {
        const ids: number[] = [];
        if (!this.selectedNodes || this.selectedNodes.length === 0) return ids;
        const seen = new Set<number>();
        const addNode = (n: any) => {
            const local: number[] = [];
            this.collectIds(n, local);
            local.forEach((id) => {
                if (!seen.has(id)) {
                    seen.add(id);
                    ids.push(id);
                }
            });
        };
        // selectedNodes may contain TreeNode objects or raw data; normalize
        this.selectedNodes.forEach((s) => addNode(s));
        return ids;
    }

    async bulkActivate() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'No selection',
                detail: 'Vui lòng chọn danh mục'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Kích hoạt ${ids.length} danh mục đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await firstValueFrom(this.service.batchActive(ids, true));
                    this.message.add({
                        severity: 'success',
                        summary: 'Kích hoạt',
                        detail: 'Đã kích hoạt'
                    });
                    this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể kích hoạt'
                    });
                }
            }
        });
    }

    async bulkDeactivate() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'No selection',
                detail: 'Vui lòng chọn danh mục'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Vô hiệu hóa ${ids.length} danh mục đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await firstValueFrom(this.service.batchActive(ids, false));
                    this.message.add({
                        severity: 'success',
                        summary: 'Vô hiệu hóa',
                        detail: 'Đã vô hiệu hóa'
                    });
                    this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể vô hiệu hóa'
                    });
                }
            }
        });
    }

    async bulkDelete() {
        const ids = this.getSelectedIds();
        if (!ids.length) {
            this.message.add({
                severity: 'warn',
                summary: 'No selection',
                detail: 'Vui lòng chọn danh mục'
            });
            return;
        }
        this.confirmation.confirm({
            message: `Xóa ${ids.length} danh mục đã chọn?`,
            header: 'Xác nhận',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await firstValueFrom(this.service.batchDelete(ids, true));
                    this.message.add({
                        severity: 'success',
                        summary: 'Xóa',
                        detail: 'Đã xóa'
                    });
                    this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa'
                    });
                }
            }
        });
    }

    // Per-row actions
    async toggleActive(item: any) {
        const id = item.id;
        try {
            await firstValueFrom(
                this.service.update(id, {
                    name: item.name,
                    description: item.description || '',
                    parentId: item.parentId || undefined,
                    order: item.order || 0,
                    active: !item.active
                } as any)
            );
            this.message.add({
                severity: 'success',
                summary: 'Cập nhật',
                detail: 'Đã thay đổi trạng thái'
            });
            this.loadData();
        } catch (e) {
            console.error(e);
            this.message.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể thay đổi trạng thái'
            });
        }
    }

    async deleteItem(item: any) {
        this.confirmation.confirm({
            message: `Bạn có chắc muốn xóa danh mục "${item.name}"?`,
            header: 'Xóa danh mục',
            icon: 'pi pi-info-circle',
            accept: async () => {
                try {
                    await firstValueFrom(this.service.delete(item.id, true));
                    this.message.add({
                        severity: 'success',
                        summary: 'Xóa',
                        detail: 'Đã xóa'
                    });
                    this.loadData();
                } catch (e) {
                    console.error(e);
                    this.message.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể xóa'
                    });
                }
            }
        });
    }

    // Placeholder for edit action (user said they'll implement later)
    openEdit(item: any) {
        // navigate to edit page or open dialog - left intentionally empty for now
        console.log('openEdit', item && item.id);
    }

    changeStatus() {
        const newActive = this.selectedStatus.code;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: 1,
                limit: this.limit,
                keyword: this.keyword || null,
                active: newActive !== undefined ? newActive : null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    onLazyLoad(event: any) {
        const newPage =
            Math.floor((event.first || 0) / (event.rows || this.limit)) + 1;
        const newLimit = event.rows || this.limit;
        if (newPage === this.page && newLimit === this.limit) return;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: newPage,
                limit: newLimit,
                keyword: this.keyword ?? null,
                active: this.active ?? null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    triggerSearch(keyword: string) {
        this.keyword = keyword;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                page: 1,
                limit: this.limit,
                keyword: keyword || null,
                active: this.active ?? null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    toggleRootExpand() {
        if (this.files && this.files.length > 0) {
            const newFiles = [...this.files];
            newFiles[0] = { ...newFiles[0], expanded: !newFiles[0].expanded };
            this.files = newFiles;
        }
    }
}

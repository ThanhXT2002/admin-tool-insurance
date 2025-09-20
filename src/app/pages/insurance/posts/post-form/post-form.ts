import {
    Component,
    effect,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { Seo } from '../../components/seo/seo';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@/layout/service/loading.service';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TexteditorCommon } from '../../components/texteditor-common/texteditor-common';
import { PostCategoryFacade } from '@/store/postCategory/postCategory.facade';
import { PostCategory } from '@/interfaces/post-category.interface';
import { PostCategoryService } from '@/pages/service/post-category.service';
import { firstValueFrom } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { Post } from '@/interfaces/post.interface';
import { TreeSelect } from 'primeng/treeselect';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoComplete } from 'primeng/autocomplete';
import { ProductApiService } from '@/pages/service/productApi.service';
import { Product } from '@/interfaces/product.interface';
import { PostStore } from '@/store/post/post.store';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

@Component({
    selector: 'app-post-form',
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        Select,
        ToggleSwitchModule,
        ButtonModule,
        Seo,
        TexteditorCommon,
        TreeSelect,
        CommonModule,
        AutoComplete,
        DatePickerModule
    ],
    encapsulation: ViewEncapsulation.None,
    templateUrl: './post-form.html',
    styleUrl: './post-form.scss'
})
export class PostForm implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);

    currentId = signal<number | undefined>(undefined);
    private previewFeaturedImage = signal<string | null>(null);

    headerTitle!: string;
    isEditMode = signal(false);
    form!: FormGroup;

    // Items provided to p-treeselect must be TreeNode[]
    items = signal<TreeNode[]>([]);
    // product options for relatedProductIds select
    productOptions = signal<Product[]>([]);
    private postCategoryService = inject(PostCategoryService);
    private productApi = inject(ProductApiService);
    seoData: any = null;
    seoStatus: 'VALID' | 'INVALID' | 'PENDING' = 'PENDING';
    @ViewChild(Seo) seoComp?: Seo;

    itemTargetAudience!: any[] | undefined;

    // submitting flag used to disable UI while creating/updating
    submitting = false;

    // edit mode fields
    createdAt?: string | null = null;
    updatedAt?: string | null = null;

    // edit mode fields
    createdBy?: string | null = null;
    updatedBy?: string | null = null;

    booleanOptions = [
        { label: 'Có', value: true },
        { label: 'Không', value: false }
    ];

    statusOptions = [
        { name: 'Đang hoạt động', code: 'PUBLISHED' },
        { name: 'Đã lưu trữ', code: 'ARCHIVED' },
        { name: 'Bản nháp', code: 'DRAFT' }
    ];

    postTypeOptions = [
        { name: 'Bài viết', code: 'ARTICLE' },
        { name: 'Hướng dẫn', code: 'GUIDE' },
        { name: 'Tin tức', code: 'NEWS' },
        { name: 'Sản phẩm', code: 'PRODUCT' },
        { name: 'Câu hỏi thường gặp', code: 'FAQ' }
    ];

    constructor() {
        this.form = this.fb.group({
            title: ['', [Validators.required]],
            excerpt: [''],
            shortContent: [''],
            content: ['', [Validators.required]],
            status: ['DRAFT', [Validators.required]],
            videoUrl: [''],
            note: [''],
            priority: [0],
            isHighlighted: [false],
            isFeatured: [false],
            postType: ['ARTICLE', [Validators.required]],
            categoryId: ['', [Validators.required]],
            taggedCategoryIds: [''],
            scheduledAt: [''],
            expiredAt: [''],
            targetAudience: [undefined],
            relatedProductIds: [undefined],
            // file control for featured image (will be attached to FormData)
            featuredImage: [null],
            metaKeywords: ['']
        });

        // Effect: cập nhật tiêu đề header khi chế độ edit/create thay đổi
        effect(() => {
            this.headerTitle = this.isEditMode()
                ? 'Cập Nhật Bài Viết'
                : 'Thêm Bài Viết';
        });
    }

    ngOnInit(): void {
        // Load category tree for treeselects
        this.loadCategories();
        // Load related products (up to 100 items)
        this.loadProducts();
    }

    private async loadCategories() {
        try {
            const resp: any = await firstValueFrom(
                this.postCategoryService.getNested({
                    includeInactive: false
                } as any)
            );
            const data: PostCategory[] | null = resp?.data ?? null;
            const nodes: TreeNode[] = Array.isArray(data)
                ? this.toTreeNodes(data)
                : [];
            this.items.set(nodes);
        } catch (err) {
            console.error('Failed to load categories for treeselect', err);
            this.items.set([]);
        }
    }

    private toTreeNodes(items: PostCategory[]): TreeNode[] {
        return items.map((it) => ({
            label: it.name,
            data: it,
            key: String(it.id),
            selectable: true,
            expanded: true,
            children: it.children ? this.toTreeNodes(it.children) : undefined
        }));
    }

    private async loadProducts() {
        try {
            const resp: any = await firstValueFrom(
                this.productApi.getAll({ limit: 100 }) as any
            );
            const payload: any = resp?.data;
            const rows: Product[] = Array.isArray(payload?.rows)
                ? payload.rows
                : [];
            this.productOptions.set(rows);
        } catch (err) {
            console.error('Failed to load related products', err);
            this.productOptions.set([]);
        }
    }

    ngOnDestroy(): void {
        // Revoke object URL if we created one to avoid memory leak
        try {
            const url = this.previewFeaturedImage();
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        } catch (err) {
            // ignore
        }
    }
    submit() {
        // mark parent controls
        this.form.markAllAsTouched();

        // validate seo child (mark touched and get boolean)
        const childValid = this.seoComp
            ? this.seoComp.validate()
            : this.seoStatus === 'VALID';

        // Prepare payload
        const payload: any = {
            ...this.form.value,
            seoMeta: this.seoData
        };

        // Log payload (mask file content) for inspection before sending
        const logged = { ...payload };
        try {
            const f = this.form.get('featuredImage')?.value;
            logged.featuredImage = f
                ? '[File]'
                : (payload.featuredImage ?? null);
        } catch (err) {
            // ignore
        }
        console.log('Prepared post payload (preview):', logged);
        console.log(
            'Featured image file object:',
            this.form.get('featuredImage')?.value ?? null
        );

        if (this.form.valid && childValid) {
            // continuing to create/update
            this.submitting = true;
            this.loadingService.show();

            const postStore = inject(PostStore);
            if (this.isEditMode() && this.currentId()) {
                const id = this.currentId() as number;
                postStore.update(id, payload);
            } else {
                postStore.create(payload);
            }
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng kiểm tra lại thông tin trong form'
            });
            this.form.markAllAsTouched();
        }
    }

    searchTargetAudience(event: AutoCompleteCompleteEvent) {
        this.targetAudience?.setValue(
            [...Array(10).keys()].map((item) => event.query + '-' + item)
        );
    }

    searchMetaKeywords(event: AutoCompleteCompleteEvent) {
        this.metaKeywords?.setValue(
            [...Array(10).keys()].map((item) => event.query + '-' + item)
        );
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }

    onFeaturedImageClick(): void {
        // allow user to pick a single image file, preview it and attach to the form
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
            const file: File = event.target.files && event.target.files[0];
            if (!file) return;

            // revoke previous blob URL if any
            try {
                const prev = this.previewFeaturedImage();
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            } catch (err) {
                // ignore
            }

            // create object URL preview and set to signal
            const url = URL.createObjectURL(file);
            this.previewFeaturedImage.set(url);

            // attach File to form control so PostService.buildFormData will include it
            this.form.get('featuredImage')?.setValue(file);
        };
        input.click();
    }

    get targetAudience() {
        return this.form.get('targetAudience');
    }
    get metaKeywords() {
        return this.form.get('metaKeywords');
    }

    // Displayed featured image: preview when available, otherwise store featured image
    get displayFeaturedImage(): string {
        return this.previewFeaturedImage() ?? this.featuredImageUrl!;
    }

    get featuredImageUrl(): string | undefined {
        // const profile = this.authStore.profile();
        // return profile?.featuredImageUrl ?? 'assets/images/featured-image-default.webp';
        return 'assets/images/no-img.webp';
    }
}

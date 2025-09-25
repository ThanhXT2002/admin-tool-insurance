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
    Validators,
    AbstractControl,
    ValidatorFn
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
import { firstValueFrom, Subscription } from 'rxjs';
import { Post } from '@/interfaces/post.interface';
import { TreeSelect } from 'primeng/treeselect';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoComplete } from 'primeng/autocomplete';
import { ProductApiService } from '@/pages/service/productApi.service';
import { Product } from '@/interfaces/product.interface';
import { PostStore } from '@/store/post/post.store';
import { MultiSelect } from 'primeng/multiselect';
import { toIsoOrUndefined } from '../../../../utils/dateTimeHelper';
import { InputNumber } from 'primeng/inputnumber';
import { Tag } from 'primeng/tag';
import { DragDropImgList } from '../../components/drag-drop-img-list/drag-drop-img-list';

interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}

@Component({
    selector: 'app-product-form',
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
        CommonModule,
        AutoComplete,
        DatePickerModule,
        MultiSelect,
        InputNumber,
        DragDropImgList
    ],
    encapsulation: ViewEncapsulation.None,
    templateUrl: './product-form.html',
    styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private postStore = inject(PostStore);

    currentId = signal<number | undefined>(undefined);
    private previewFeaturedImage = signal<string | null>(null);

    headerTitle!: string;
    isEditMode = signal(false);
    form!: FormGroup;

    // product options for relatedProductIds select
    productOptions = signal<Product[]>([]);
    private postCategoryService = inject(PostCategoryService);
    private facadePostCategory = inject(PostCategoryFacade);
    private productApi = inject(ProductApiService);
    private _subs = new Subscription();
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
        { name: 'Hoạt động', code: true },
        { name: 'Không hoạt động', code: false }
    ];

    saleOnlineOptions = [
        { name: 'Có', code: true },
        { name: 'Không', code: false }
    ];
    promotionOptions = [
        { name: 'Có khuyến mãi', code: true },
        { name: 'Không có khuyến mãi', code: false }
    ];

    termOptions = [
        { name: '1 năm', code: '1Y' },
        { name: '2 năm', code: '2Y' },
        { name: '3 năm', code: '3Y' }
    ];

    constructor() {
        this.form = this.fb.group(
            {
                name: ['', [Validators.required]],
                description: [''],
                shortContent: [''],
                content: ['', [Validators.required]],
                price: [undefined, [Validators.min(0)]],
                coverage: [undefined],
                term: [''],
                targetLink: [''],
                targetFile: [''],
                details: [''],
                active: [true, [Validators.required]],
                note: [''],
                priority: [0],
                isHighlighted: [false],
                isFeatured: [false],
                isSaleOnline: [false],
                isPromotion: [false],
                promotionDetails: [''],
                tags: [undefined],
                imgs: [[], this.imgsValidator],
                icon: [null, Validators.required],
                metaKeywords: ['']
            },
            { validators: this.dateRangeValidator() }
        );

        // Effect: cập nhật tiêu đề header khi chế độ edit/create thay đổi
        effect(() => {
            this.headerTitle = this.isEditMode()
                ? 'Cập Nhật Sản Phẩm'
                : 'Thêm Sản Phẩm';
        });
    }

    // Validator: imgs must have at least 1 image
    private imgsValidator(control: AbstractControl) {
        const value = control.value;
        if (!value || !Array.isArray(value) || value.length === 0) {
            return { required: true };
        }
        return null;
    }

    // Validator: optional YouTube URL validator
    // Accepts empty value. If provided, must match common YouTube URL formats.
    youtubeUrlValidator(control: AbstractControl) {
        const v = control.value;
        if (!v) return null;
        try {
            const s = String(v).trim();
            // common patterns: https://www.youtube.com/watch?v=..., https://youtu.be/...
            const ytRegex =
                /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{6,}/i;
            return ytRegex.test(s) ? null : { youtubeUrl: true };
        } catch (err) {
            return { youtubeUrl: true };
        }
    }

    // Validator: expiredAt must be greater than scheduledAt (if both provided)
    private dateRangeValidator(): ValidatorFn {
        return (group: AbstractControl) => {
            const scheduled = group.get('scheduledAt')?.value;
            const expired = group.get('expiredAt')?.value;
            if (!scheduled || !expired) {
                // clear any previous error
                group.get('expiredAt')?.setErrors(null);
                return null;
            }

            const s = new Date(scheduled).getTime();
            const e = new Date(expired).getTime();
            if (isNaN(s) || isNaN(e)) {
                group.get('expiredAt')?.setErrors(null);
                return null;
            }

            if (e <= s) {
                group.get('expiredAt')?.setErrors({ dateRange: true });
                return { dateRange: true };
            }

            // valid -> clear error
            group.get('expiredAt')?.setErrors(null);
            return null;
        };
    }

    // hasDateRangeError() moved to bottom (keeps runtime checks centralized)

    ngOnInit(): void {
        // Load category tree for treeselects

        // Load related products (up to 100 items)
        this.loadProducts();

        // Real-time date range validation: subscribe to changes
        const scheduledCtrl = this.form.get('scheduledAt');
        const expiredCtrl = this.form.get('expiredAt');
        if (scheduledCtrl) {
            this._subs.add(
                scheduledCtrl.valueChanges.subscribe(() =>
                    this.validateDateRange()
                )
            );
        }
        if (expiredCtrl) {
            this._subs.add(
                expiredCtrl.valueChanges.subscribe(() =>
                    this.validateDateRange()
                )
            );
        }

        // If route contains an id param -> load post for edit
        try {
            const idParam = this.route.snapshot.paramMap.get('id');
            if (idParam) {
                const id = Number(idParam);
                if (!isNaN(id)) {
                    this.currentId.set(id);
                    this.isEditMode.set(true);
                    // load details and populate form
                    this.loadPostForEdit(id).catch((err) => {
                        console.error('Failed to load post for edit', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Lỗi',
                            detail: 'Không thể tải chi tiết bài viết'
                        });
                    });
                }
            }
        } catch (err) {
            // ignore
        }
    }

    // Load post detail and populate the form for update
    private async loadPostForEdit(id: number) {
        this.loadingService.show();
        try {
            const post: Post = await this.postStore.fetchById(id);
            if (!post) throw new Error('Post not found');

            // basic fields
            this.form.get('title')?.setValue(post.title ?? '');
            this.form.get('excerpt')?.setValue(post.excerpt ?? '');
            this.form.get('shortContent')?.setValue(post.shortContent ?? '');
            this.form.get('content')?.setValue(post.content ?? '');
            this.form.get('status')?.setValue(post.status ?? 'DRAFT');
            this.form.get('videoUrl')?.setValue(post.videoUrl ?? '');
            this.form.get('note')?.setValue(post.note ?? '');
            this.form.get('priority')?.setValue(post.priority ?? 0);
            this.form.get('isHighlighted')?.setValue(!!post.isHighlighted);
            this.form.get('isFeatured')?.setValue(!!post.isFeatured);
            this.form.get('postType')?.setValue(post.postType ?? 'ARTICLE');

            // category: API returns full category object
            if (post.category && post.category.id != null) {
                this.form.get('categoryId')?.setValue(post.category.id);
            }

            // tagged categories -> set ids array
            if (Array.isArray(post.taggedCategories)) {
                this.form
                    .get('taggedCategoryIds')
                    ?.setValue(post.taggedCategories.map((c: any) => c.id));
            }

            // related products -> set array of ids
            if (Array.isArray(post.relatedProducts)) {
                this.form
                    .get('relatedProductIds')
                    ?.setValue(post.relatedProducts.map((p: any) => p.id));
            }

            // dates: convert ISO -> Date for datepicker
            try {
                this.form
                    .get('scheduledAt')
                    ?.setValue(
                        post.scheduledAt ? new Date(post.scheduledAt) : ''
                    );
            } catch (err) {}
            try {
                this.form
                    .get('expiredAt')
                    ?.setValue(post.expiredAt ? new Date(post.expiredAt) : '');
            } catch (err) {}

            // targetAudience and metaKeywords are arrays
            if (Array.isArray(post.targetAudience))
                this.form.get('targetAudience')?.setValue(post.targetAudience);
            if (Array.isArray(post.metaKeywords))
                this.form.get('metaKeywords')?.setValue(post.metaKeywords);

            // featured image: backend returns URL -> use as preview and set control to string
            if (post.featuredImage) {
                try {
                    this.previewFeaturedImage.set(post.featuredImage as any);
                    // set form control to URL so buildFormData can send existing URL
                    this.form
                        .get('featuredImage')
                        ?.setValue(post.featuredImage);
                } catch (err) {}
            }

            // Load existing images for drag-drop component
            if (
                Array.isArray((post as any).imgs) &&
                (post as any).imgs.length > 0
            ) {
                try {
                    const existingImages = (post as any).imgs.map(
                        (imgUrl: string) => ({
                            url: imgUrl,
                            isNew: false,
                            name: imgUrl.split('/').pop() || 'image'
                        })
                    );
                    this.form.get('imgs')?.setValue(existingImages);
                } catch (err) {
                    console.warn('Error loading existing images:', err);
                }
            }

            // SEO meta
            if (post.seoMeta) {
                this.seoData = post.seoMeta;
                this.seoStatus = 'VALID';
                // if Seo component exposes a setter we could call it, but keep data in seoData
                try {
                    // @ts-ignore - optional helper if Seo component implements setData
                    if (
                        this.seoComp &&
                        typeof (this.seoComp as any).setData === 'function'
                    )
                        (this.seoComp as any).setData(post.seoMeta);
                } catch (err) {}
            }

            // audit fields for display
            this.createdAt = post.createdAt ?? null;
            this.updatedAt = post.updatedAt ?? null;
            // createdBy/updatedBy aren't in the typed Post interface; read defensively
            this.createdBy = (post as any)?.createdBy ?? null;
            this.updatedBy = (post as any)?.updatedBy ?? null;

            // mark form as pristine since we loaded remote data
            try {
                this.form.markAsPristine();
                this.form.markAsUntouched();
            } catch (err) {}
        } finally {
            try {
                this.loadingService.hide();
                console.log('form value', this.form.value);
            } catch (ignore) {}
        }
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
        try {
            this._subs.unsubscribe();
        } catch (err) {
            // ignore
        }
    }

    async submit() {
        console.log('[PostForm] form submit, form value:', this.form.value);
        this.form.markAllAsTouched();
        const childValid = this.seoComp
            ? this.seoComp.validate()
            : this.seoStatus === 'VALID';

        if (!this.form.valid || !childValid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng kiểm tra lại thông tin trong form'
            });
            this.form.markAllAsTouched();
            return;
        }

        const payload = this.buildPayload();

        // show loading
        this.submitting = true;
        this.loadingService.show();

        try {
            const result = await this.performSave(payload);
            this.handleSaveSuccess(result);
        } catch (err: any) {
            console.error(
                '[PostForm] submit error, form before handling error:',
                this.form.value,
                err
            );
            this.handleSaveError(err);
            console.log(
                '[PostForm] submit error handled, form after handling error:',
                this.form.value
            );
            return;
        } finally {
            this.submitting = false;
            try {
                this.loadingService.hide();
            } catch (ignore) {}
        }
    }

    // Build payload and normalize dates
    private buildPayload(): any {
        const normalizedScheduled = toIsoOrUndefined(
            this.form.get('scheduledAt')?.value
        );
        const normalizedExpired = toIsoOrUndefined(
            this.form.get('expiredAt')?.value
        );

        const payload: any = {
            ...this.form.value,
            scheduledAt: normalizedScheduled,
            expiredAt: normalizedExpired,
            seoMeta: this.seoData
        };

        // Process imgs data from drag-drop component
        this.processImgsData(payload);

        // normalize relations
        this.normalizeRelations(payload);

        // mask file for logs
        const logged = { ...payload };
        try {
            const f = this.form.get('featuredImage')?.value;
            logged.featuredImage = f
                ? '[File]'
                : (payload.featuredImage ?? null);

            // Mask imgs files for logging
            if (payload.imgsFiles && payload.imgsFiles.length > 0) {
                logged.imgsFiles = `[${payload.imgsFiles.length} files]`;
            }
        } catch (err) {}
        console.log('Prepared post payload (preview):', logged);
        console.log(
            'Featured image file object:',
            this.form.get('featuredImage')?.value ?? null
        );
        console.log('Images data:', {
            imgsFiles: payload.imgsFiles?.length || 0,
            imgsKeep: payload.imgsKeep?.length || 0
        });

        return payload;
    }

    // Process imgs data from drag-drop component
    private processImgsData(payload: any) {
        const imgsData = this.form.get('imgs')?.value || [];

        // Separate new files and existing images
        payload.imgsFiles = [];
        payload.imgsKeep = [];

        if (Array.isArray(imgsData)) {
            imgsData.forEach((item: any) => {
                if (item.isNew && item.file) {
                    // New file to upload
                    payload.imgsFiles.push(item.file);
                } else if (item.url && !item.isNew) {
                    // Existing image to keep
                    payload.imgsKeep.push(item.url);
                }
            });
        }

        // Remove the original imgs field as we now have imgsFiles and imgsKeep
        delete payload.imgs;
    }

    // Normalize category/taggedCategory/relatedProduct values to plain ids (in-place)
    private normalizeRelations(payload: any) {
        try {
            const rawCat = this.form.get('categoryId')?.value;
            if (rawCat == null || rawCat === '') payload.categoryId = undefined;
            else if (typeof rawCat === 'number') payload.categoryId = rawCat;
            else if (typeof rawCat === 'string' && !isNaN(Number(rawCat)))
                payload.categoryId = Number(rawCat);
            else if (rawCat && typeof rawCat === 'object')
                payload.categoryId = rawCat.id ?? rawCat.data?.id;

            const rawTagged = this.form.get('taggedCategoryIds')?.value;
            if (Array.isArray(rawTagged)) {
                payload.taggedCategoryIds = rawTagged
                    .map((it: any) => {
                        if (it == null) return it;
                        if (typeof it === 'number') return it;
                        if (typeof it === 'string' && !isNaN(Number(it)))
                            return Number(it);
                        if (typeof it === 'object')
                            return it.id ?? it.data?.id ?? null;
                        return null;
                    })
                    .filter((v: any) => v != null);
            } else {
                payload.taggedCategoryIds = undefined;
            }

            const rawRelated = this.form.get('relatedProductIds')?.value;
            if (Array.isArray(rawRelated)) {
                payload.relatedProductIds = rawRelated
                    .map((it: any) => {
                        if (it == null) return it;
                        if (typeof it === 'number') return it;
                        if (typeof it === 'string' && !isNaN(Number(it)))
                            return Number(it);
                        if (typeof it === 'object') return it.id ?? null;
                        return null;
                    })
                    .filter((v: any) => v != null);
            } else {
                payload.relatedProductIds = undefined;
            }
        } catch (err) {
            console.warn('Failed to normalize category/related values', err);
        }
    }

    // perform save and return the created/updated record or null on update
    private async performSave(payload: any): Promise<any> {
        if (this.isEditMode() && this.currentId()) {
            const id = this.currentId() as number;
            const updated = await this.postStore.update(id, payload);
            return { action: 'update', record: updated };
        } else {
            const created = await this.postStore.create(payload);
            return { action: 'create', record: created };
        }
    }

    private handleSaveSuccess(result: any) {
        if (result.action === 'update') {
            this.messageService.add({
                severity: 'success',
                summary: 'Cập nhật',
                detail: 'Cập nhật bài viết thành công'
            });
        } else {
            this.messageService.add({
                severity: 'success',
                summary: 'Tạo',
                detail: 'Tạo bài viết thành công'
            });
        }
        // navigate back to posts list on success
        try {
            this.router
                .navigate(['/insurance/posts'], { relativeTo: this.route })
                .catch((navErr) =>
                    console.warn(
                        'Chuyển hướng đến danh sách bài viết thất bại',
                        navErr
                    )
                );
        } catch (navErr) {
            console.warn(
                'Chuyển hướng đến danh sách bài viết thất bại',
                navErr
            );
        }
    }

    private handleSaveError(err: any) {
        console.error('Error saving post:', err);
        this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.errors ?? 'Có lỗi xảy ra khi lưu bài viết'
        });
        // ensure loading / submitting are turned off immediately on failure
        this.submitting = false;
        try {
            this.loadingService.hide();
        } catch (ignore) {}
    }

    searchTags(event: AutoCompleteCompleteEvent) {
        this.tags?.setValue(
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
        return !!(
            control &&
            control.invalid &&
            (control.touched || control.dirty)
        );
    }

    private validateDateRange() {
        try {
            const sc = this.form.get('scheduledAt');
            const ec = this.form.get('expiredAt');
            if (!sc || !ec) return;
            const sVal = sc.value;
            const eVal = ec.value;
            if (!sVal || !eVal) {
                // clear dateRange error
                const curErr = ec.errors;
                if (curErr && (curErr as any)['dateRange']) {
                    // remove dateRange only
                    const copy = { ...curErr };
                    delete (copy as any).dateRange;
                    if (Object.keys(copy).length === 0) ec.setErrors(null);
                    else ec.setErrors(copy);
                }
                return;
            }

            const s = new Date(sVal);
            const e = new Date(eVal);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) {
                // not comparable
                return;
            }

            if (e <= s) {
                // set dateRange error on expiredAt
                const prev = ec.errors || {};
                ec.setErrors({ ...prev, dateRange: true });
                // mark touched so UI shows invalid immediately
                try {
                    ec.markAsTouched();
                } catch (err) {}
            } else {
                // remove dateRange error only
                const prev = ec.errors;
                if (prev && (prev as any)['dateRange']) {
                    const copy = { ...prev };
                    delete (copy as any).dateRange;
                    if (Object.keys(copy).length === 0) ec.setErrors(null);
                    else ec.setErrors(copy);
                }
            }
        } catch (err) {
            // ignore
        }
    }

    hasDateRangeError() {
        const ec = this.form.get('expiredAt');
        return !!(ec && ec.errors && (ec.errors as any).dateRange);
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

    get tags() {
        return this.form.get('tags');
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

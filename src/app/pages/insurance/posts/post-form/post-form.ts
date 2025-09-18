import { Component, effect, inject, signal, ViewChild } from '@angular/core';
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
import { CkeditorCommon } from '../../components/ckeditor-common/ckeditor-common';
import { PostCategoryFacade } from '@/store/postCategory/postCategory.facade';
import { PostCategory } from '@/interfaces/post-category.interface';
import { Post } from '@/interfaces/post.interface';
import { TreeSelect } from 'primeng/treeselect';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoComplete } from 'primeng/autocomplete';

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
        CkeditorCommon,
        TreeSelect,
        CommonModule,
        AutoComplete,
        DatePickerModule
    ],
    templateUrl: './post-form.html',
    styleUrl: './post-form.scss'
})
export class PostForm {
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    private facade = inject(PostCategoryFacade);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);

    currentId = signal<number | undefined>(undefined);
    private previewFeaturedImage = signal<string | null>(null);

    headerTitle!: string;
    isEditMode = signal(false);
    form!: FormGroup;

    items = signal<PostCategory[]>([]);
    seoData: any = null;
    seoStatus: 'VALID' | 'INVALID' | 'PENDING' = 'PENDING';
    @ViewChild(Seo) seoComp?: Seo;

    itemTargetAudience!: any[] | undefined;

    // edit mode fields
    createdAt?: string | null = null;
    updatedAt?: string | null = null;

    // edit mode fields
    createdBy?: string | null = null;
    updatedBy?: string | null = null;

    constructor() {
        this.form = this.fb.group({
            title: ['', [Validators.required]],
            excerpt: [''],
            shortContent: [''],
            content: ['', [Validators.required]],
            status: [undefined, [Validators.required]],
            videoUrl: [''],
            note: [''],
            priority: [0],
            isHighlighted: [false],
            isFeatured: [false],
            postType: [undefined, [Validators.required]],
            categoryId: ['', [Validators.required]],
            taggedCategoryIds: [''],
            scheduledAt: [''],
            expiredAt: [''],
            targetAudience: [undefined],
            relatedProducts: [undefined],
            metaKeywords: ['']
        });

        // Effect: cập nhật tiêu đề header khi chế độ edit/create thay đổi
        effect(() => {
            this.headerTitle = this.isEditMode()
                ? 'Cập Nhật Bài Viết'
                : 'Thêm Bài Viết';
        });

        // Effect: khi `facade.selected()` trả về item (ví dụ khi loadById hoàn tất),
        // patch giá trị vào form. Đồng thời đảm bảo parent option tồn tại
        // trong `items` để p-select hiển thị nhãn.
        // Lưu ý: effect này được tạo trong constructor để có injection context
        effect(() => {
            const sel = this.facade.selected();
            const id = this.currentId();
            if (sel && id && sel.id === id) {
                // Only patch the form if incoming values differ from current form
                // to avoid re-patch loops when effects/streams emit repeatedly.
                const cur = this.form.value || {};
                const needPatch =
                    cur.name !== sel.name ||
                    (cur.parentId ?? null) !== (sel.parentId ?? null) ||
                    cur.order !== sel.order ||
                    !!cur.active !== !!sel.active ||
                    (cur.description ?? '') !== (sel.description ?? '');

                if (needPatch) {
                    // Use emitEvent:false to avoid triggering valueChange subscriptions
                    // that might feed back into effects.
                    this.form.patchValue(
                        {
                            name: sel.name,
                            parentId: sel.parentId,
                            order: sel.order,
                            active: !!sel.active,
                            description: sel.description
                        },
                        { emitEvent: false }
                    );
                }
                this.seoData = sel.seoMeta ?? null;
                this.createdAt = sel.createdAt;
                this.updatedAt = sel.updatedAt;
                this.createdBy = sel.createdBy;
                this.updatedBy = sel.updatedBy;
            }
        });
    }

    submit() {}

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
        // prevent concurrent uploads

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
            const file: File = event.target.files && event.target.files[0];
            if (!file) return;



            // create preview
            const reader = new FileReader();
            reader.onload = (e: any) => {




            };
            reader.readAsDataURL(file);
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
        return 'assets/images/no-img.webp'
    }
}

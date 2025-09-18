import {
    Component,
    effect,
    inject,
    signal,
    ViewChild
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
import { PostCategoryFacade } from '@/store/postCategory/postCategory.facade';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@/layout/service/loading.service';
import { PostCategory } from '@/pages/service/post-category.service';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-post-category-form',
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        Select,
        ToggleSwitchModule,
        ButtonModule,
        Seo,
        CommonModule
    ],
    templateUrl: './post-category-form.html',
    styleUrl: './post-category-form.scss'
})
export class PostCategoryForm {
    // Tiêu đề header hiển thị trên form (thay đổi theo create / update)
    headerTitle: string = 'Thêm Danh Mục Bài Viết';
    private fb = inject(FormBuilder);
    private facade = inject(PostCategoryFacade);
    private loadingService = inject(LoadingService);
    private messageService = inject(MessageService);


    // Danh sách options cho select (dẫn từ facade.items() nhưng có thể được
    // mở rộng tại chỗ nếu parent cần hiển thị nhưng chưa có trong items())
    items = signal<PostCategory[]>([]);
    // Route và id hiện tại (nếu đang edit sẽ lưu id để lọc ra khỏi options)
    private route = inject(ActivatedRoute);
    currentId = signal<number | undefined>(undefined);

    // Signal boolean biểu thị form đang ở chế độ chỉnh sửa hay tạo mới
    isEditMode = signal(false);

    // FormGroup chính của component
    form!: FormGroup;
    // Cờ khi submit đang tiến hành (chỉ dùng để disable UI/hiển thị loader)
    submitting = false;
    // SEO data và trạng thái được nhận từ child component `<app-seo>`
    seoData: any = null;
    seoStatus: 'VALID' | 'INVALID' | 'PENDING' = 'PENDING';

    // Tham chiếu tới component SEO child để gọi validate()
    @ViewChild(Seo) seoComp?: Seo;

    // Dự trữ các parent được thêm cục bộ (nếu items không chứa parent cần hiển thị)
    postParent: PostCategory[] = [];
    private _extraParents: PostCategory[] = [];

    // edit mode fields
    createdAt?: string | null = null;
    updatedAt?: string | null = null;

        // edit mode fields
    createdBy?: string | null = null;
    updatedBy?: string | null = null;

    constructor() {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            parentId: [undefined],
            order: [0],
            active: [true],
            description: ['']
        });

        // Effect: cập nhật tiêu đề header khi chế độ edit/create thay đổi
        effect(() => {
            this.headerTitle = this.isEditMode()
                ? 'Cập Nhật Danh Mục Bài Viết'
                : 'Thêm Danh Mục Bài Viết';
        });

        // Effect: đồng bộ `items` từ facade, nhưng:
        // - Khi ở chế độ edit, sẽ loại bỏ bản ghi hiện tại khỏi danh sách
        //   options (không cho phép chọn chính nó làm parent).
        // - Nếu có các parent cục bộ (`_extraParents`) chưa có trong rows,
        //   ghép chúng vào trước để select có thể hiển thị label cho parent
        //   đã được chọn nhưng không nằm trong `rows`.
        effect(() => {
            const rows = this.facade.items() || [];
            // Lọc ra bản ghi hiện tại khi edit
            const curId = this.currentId();
            const baseRows =
                this.isEditMode() && curId != null
                    ? rows.filter((r) => r.id !== curId)
                    : rows;

            // Lọc các extra parents không có trong baseRows và không phải là curId
            const extras = this._extraParents.filter(
                (ep) => !baseRows.some((r) => r.id === ep.id) && ep.id !== curId
            );
            if (extras.length > 0) {
                this.items.set([...extras, ...baseRows]);
            } else {
                this.items.set(baseRows);
            }
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


    ngOnInit() {
        this.facade.load({
            page: undefined,
            limit: 1000,
            keyword: '',
            active: true
        });

        const idParam = Number(this.route.snapshot.paramMap.get('id'));
        if (idParam) {
            this.isEditMode.set(true);
            this.currentId.set(idParam);
            // dispatch load single item
            this.facade.loadById(idParam);
            // The effect that patches the form runs in the constructor and
            // will react when facade.selected() becomes available and matches currentId.
        }
    }

    submit() {
        // mark parent controls
        this.form.markAllAsTouched();

        // validate child (mark touched and get boolean)
        const childValid = this.seoComp
            ? this.seoComp.validate()
            : this.seoStatus === 'VALID';

        // debug logs removed

        if (this.form.valid && childValid) {
            // continuing to create/update
            const payload = {
                ...this.form.value,
                seoMeta: this.seoData
            };

            // flip submitting/loading flags and show global loader;
            // createComplete$ / updateComplete$ effects will hide loader and navigate on success
            this.submitting = true;
            this.loadingService.show();

            // Call facade update or create depending on mode
            if (this.isEditMode() && this.currentId()) {
                const id = this.currentId() as number;
                this.facade.update(id, payload);
            } else {
                this.facade.create(payload);
            }
            // this.saved.emit();
        } else {
          this.messageService.add({
                severity: 'error',
                summary: 'Thiếu thông tin',
                detail: 'Vui lòng kiểm tra lại thông tin trong form'
            });
            this.form.markAllAsTouched();
        }
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }
}

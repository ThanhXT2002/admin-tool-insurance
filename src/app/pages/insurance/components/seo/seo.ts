import {
    ChangeDetectionStrategy,
    Component,
    computed,
    EventEmitter,
    inject,
    input,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    MaxLengthValidator,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { createSlug } from '@/utils/slugHelper';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-seo',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        Select,
        ToggleSwitchModule,
        ButtonModule,
        InputGroup,
        InputGroupAddon
    ],
    templateUrl: './seo.html',
    styleUrl: './seo.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Seo implements OnInit, OnDestroy {
    /**
     * Giá trị ban đầu để patch vào form khi component khởi tạo (ví dụ khi edit)
     * Nếu parent cập nhật `initialValue` sau khi component đã mount (ví dụ
     * load async khi edit), setter sẽ patch dữ liệu vào form.
     */
    private _initialValue: any | null = null;
    @Input() set initialValue(v: any | null) {
        this._initialValue = v;
        if (v) {
            // use the component's patchValue helper (keeps normalization behavior)
            this.patchValue(v);
        }
    }
    get initialValue(): any | null {
        return this._initialValue;
    }

    /**
     * `segment` là một signal input (không bắt buộc) dùng để build domain preview
     * Ví dụ: domainFe = environment.DOMAIN_FE + '/' + segment()
     */
    segment = input<string>('');
    /**
     * Khi createMode=false (ví dụ đang ở chế độ update), SEO sẽ không auto-fill
     * seoTitle từ parentName. Mặc định là true (create mode).
     */
    @Input() createMode = true;
    /**
     * Setter nhận tên từ parent (ví dụ tên danh mục).
     * Mục tiêu: khi parent gõ tên, seoTitle sẽ tự điền theo nếu control seoTitle còn `pristine`.
     * Nếu user đã sửa seoTitle (control dirty) thì sẽ không override.
     */
    @Input() set parentName(v: string | null) {
        // Only auto-fill from parentName when in create mode
        if (!this.createMode) return;
        const ctrl = this.form.get('seoTitle');
        if (!ctrl || v == null) return;

        if (ctrl.pristine) {
            const title = String(v).trim();
            // Cập nhật seoTitle nhưng không phát `valueChanges` để tránh emit thừa
            // giữ trạng thái pristine để hiểu đây là auto-fill từ parent
            ctrl.setValue(title, { emitEvent: false });
            ctrl.markAsPristine();

            // Đồng thời cập nhật canonicalUrl tự động (theo seoTitle) nếu
            // canonical vẫn pristine hoặc bằng giá trị auto trước đó.
            // Điều này giúp canonical theo seoTitle khi parent patch, nhưng
            // không đè lên canonical do user đã chỉnh tay.
            const canonicalCtrl = this.form.get('canonicalUrl');
            if (canonicalCtrl) {
                const auto = createSlug(title);
                const current = canonicalCtrl.value;
                if (
                    canonicalCtrl.pristine ||
                    current === this.lastAutoCanonical
                ) {
                    // set without emitting events và giữ trạng thái pristine
                    canonicalCtrl.setValue(auto, { emitEvent: false });
                    canonicalCtrl.markAsPristine();
                    this.lastAutoCanonical = auto;
                }
            }
        }
    }
    @Output() valueChange = new EventEmitter<any>();
    @Output() statusChange = new EventEmitter<
        'VALID' | 'INVALID' | 'PENDING'
    >();

    /**
     * `domainFe` là giá trị tính toán hiển thị preview đường dẫn
     * Ví dụ: https://example.com/<segment>
     */
    domainFe = computed(
        () => environment.DOMAIN_FE + '/' + (this.segment() || '').trim()
    );

    private fb = inject(FormBuilder);
    /**
     * Reactive form nội bộ của component. Component tự quản validation,
     * và emit value/status ra parent.
     */
    form: FormGroup = this.fb.group({
        // Tiêu đề SEO hiển thị trên trang/preview
        seoTitle: ['', [Validators.required, Validators.maxLength(120)]],
        // Mô tả meta
        metaDescription: ['', [Validators.required, Validators.maxLength(255)]],
        // Canonical (slug/đường dẫn) - sẽ auto-generate từ seoTitle nếu cần
        canonicalUrl: ['', [Validators.required]],
        // Từ khóa chính
        focusKeyword: ['', [Validators.required, Validators.maxLength(100)]],
        // OG type (lưu dạng string khi emit)
        ogType: [undefined, [Validators.required]],
        // Các cờ noindex / nofollow
        noindex: [false],
        nofollow: [false]
    });

    private sub = new Subscription();

    // Các lựa chọn ogType hiển thị trong select
    ogTypeOptions: any[] = [
        { value: 'website', label: 'Website - Trang chủ/Landing page' },

        // Content Types
        { value: 'article', label: 'Article - Bài viết/Blog (default)' },
        { value: 'blog', label: 'Blog - Danh mục blog' },

        // Products & Services
        { value: 'product', label: 'Product - Sản phẩm bảo hiểm' },
        {
            value: 'business',
            label: 'Business - Doanh nghiệp/Công ty'
        },

        // Media & Rich Content
        { value: 'video', label: 'Video - Video giới thiệu/hướng dẫn' },
        { value: 'image', label: 'Image - Hình ảnh/Infographic' },

        // Profile & About
        { value: 'profile', label: 'Profile - Trang giới thiệu/Về chúng tôi' },

        // Others
        { value: 'object', label: 'Object - Đối tượng khác' }
    ];

    private lastAutoCanonical = '';

    /**
     * Khởi tạo component:
     * - Nếu có `initialValue` (ví dụ edit), patch vào form (sau khi normalize ogType)
     * - Tự động sync canonicalUrl từ seoTitle khi user thay đổi seoTitle
     *   (với cơ chế chỉ update khi canonical chưa bị user chỉnh)
     * - Emit valueChange (đã normalize) và statusChange để parent lắng nghe
     */
    ngOnInit(): void {
        // Patch initial value khi edit
        if (this.initialValue) {
            this.form.patchValue(this.initialValue);
        }

        // Đồng bộ canonicalUrl từ seoTitle (khi user thay đổi seoTitle)
        const seoTitleCtrl = this.form.get('seoTitle');
        const canonicalCtrl = this.form.get('canonicalUrl');

        if (seoTitleCtrl && canonicalCtrl) {
            this.sub.add(
                // lắng valueChanges của seoTitle và generate slug
                seoTitleCtrl.valueChanges.subscribe((title: string) => {
                    const auto = createSlug(title);
                    const current = canonicalCtrl.value;
                    // Chỉ cập nhật canonical khi user chưa chỉnh hoặc khi
                    // canonical bằng giá trị auto trước đó (theo dõi changes)
                    if (
                        canonicalCtrl.pristine ||
                        current === this.lastAutoCanonical
                    ) {
                        // setValue không emit event để tránh vòng lặp
                        canonicalCtrl.setValue(auto, { emitEvent: false });
                        canonicalCtrl.markAsPristine();
                        this.lastAutoCanonical = auto;
                    }
                })
            );
        }

        // Emit giá trị mỗi khi form thay đổi (ogType là string thanks to optionValue)
        this.sub.add(
            this.form.valueChanges.subscribe((v) => this.valueChange.emit(v))
        );
        // Emit trạng thái form
        this.sub.add(
            this.form.statusChanges.subscribe((s) =>
                this.statusChange.emit(s as any)
            )
        );
        // Emit initial state once
        this.valueChange.emit(this.form.value);
        this.statusChange.emit(this.form.status as any);
    }

    // Parent có thể gọi để bắt validate (mark touched + trả về boolean)
    validate(): boolean {
        this.form.markAllAsTouched();
        return this.form.valid;
    }

    /**
     * Patch dữ liệu vào form từ parent (ví dụ khi parent load dữ liệu edit)
     * Trước khi patch sẽ normalize `ogType` nếu parent truyền object {value,label}
     */
    patchValue(v: any): void {
        const data = { ...(v ?? {}) };
        // Normalize canonicalUrl: if server returns a full URL, extract last path segment
        if (data.canonicalUrl && typeof data.canonicalUrl === 'string') {
            try {
                const url = new URL(data.canonicalUrl);
                // remove trailing slash
                const pathname = url.pathname.replace(/\/$/, '');
                const parts = pathname.split('/').filter(Boolean);
                if (parts.length > 0) {
                    data.canonicalUrl = parts[parts.length - 1];
                } else {
                    data.canonicalUrl = '';
                }
            } catch (err) {
                // not a full URL, maybe already a slug - leave as is
            }
        }

        this.form.patchValue(data);
    }

    /**
     * Chuẩn hóa khi emit: đảm bảo `ogType` luôn là string
     * Nếu form hiện tại giữ ogType là object (ví dụ do patch từ parent),
     * convert sang ogType.value
     */
    // Note: ogType uses optionValue="value" in template, so it is a string.

    /**
     * Kiểm tra control có invalid và đã touched (dùng trong template để hiển thị lỗi)
     */
    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }

    /**
     * Hủy các subscription khi component bị destroy để tránh memory leak
     */
    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}

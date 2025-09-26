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
    private _initialValue: any | null = null;
    @Input() set initialValue(v: any | null) {
        this._initialValue = v;
        if (v) {
            this.patchValue(v);
        }
    }

    @Input() parentName: string = '';

    get initialValue(): any | null {
        return this._initialValue;
    }
    segment = input<string>('');
    @Input() createMode = true;
    @Output() valueChange = new EventEmitter<any>();
    @Output() statusChange = new EventEmitter<
        'VALID' | 'INVALID' | 'PENDING'
    >();
    domainFe = computed(
        () => environment.DOMAIN_FE + '/' + (this.segment() || '').trim()
    );
    private fb = inject(FormBuilder);
    form: FormGroup = this.fb.group({
        seoTitle: ['', [Validators.required, Validators.maxLength(120)]],
        metaDescription: ['', [Validators.required, Validators.maxLength(255)]],
        canonicalUrl: ['', [Validators.required]],
        focusKeyword: ['', [Validators.required, Validators.maxLength(100)]],
        ogType: ['article', [Validators.required]],
        noindex: [false],
        nofollow: [false]
    });

    private sub = new Subscription();
    ogTypeOptions: any[] = [
        { value: 'article', label: 'Article - Bài viết/Blog (default)' },
        { value: 'website', label: 'Website - Trang chủ/Landing page' },
        { value: 'blog', label: 'Blog - Danh mục blog' },
        { value: 'product', label: 'Product - Sản phẩm bảo hiểm' },
        { value: 'business', label: 'Business - Doanh nghiệp/Công ty' },
        { value: 'video', label: 'Video - Video giới thiệu/hướng dẫn' },
        { value: 'image', label: 'Image - Hình ảnh/Infographic' },
        { value: 'profile', label: 'Profile - Trang giới thiệu/Về chúng tôi' },
        { value: 'object', label: 'Object - Đối tượng khác' }
    ];

    private lastAutoCanonical = '';

    // ===== CÁC HÀM TEST DATA (CHỈ DÙNG TRONG DEVELOPMENT) =====

    // Điền dữ liệu test nếu đang ở development và chế độ create
    private fillTestDataIfNeeded(): void {
        if (
            !environment.production &&
            this.createMode &&
            this.form.get('seoTitle')?.pristine
        ) {
            setTimeout(() => this.fillSeoTestData(), 100);
        }
    }

    // Điền dữ liệu test vào SEO form
    private fillSeoTestData(): void {
        const testData = this.generateSeoTestData();
        this.form.patchValue(testData);
        console.log('✅ Đã điền dữ liệu test vào SEO form (Development mode)');
    }

    // Tạo dữ liệu SEO test ngẫu nhiên
    private generateSeoTestData(): any {
        const seoTitleBase = this.parentName || 'Sản phẩm bảo hiểm';
        const productTypes = [
            'Bảo hiểm ô tô',
            'Bảo hiểm sức khỏe',
            'Bảo hiểm nhân thọ'
        ];
        const randomType =
            productTypes[Math.floor(Math.random() * productTypes.length)];

        const keywords = [
            'bảo hiểm online',
            'mua bảo hiểm giá tốt',
            'bảo hiểm uy tín',
            'tư vấn bảo hiểm',
            'bảo hiểm toàn diện',
            'quy trình claims nhanh'
        ];
        const randomKeyword =
            keywords[Math.floor(Math.random() * keywords.length)];

        const benefits = [
            'ưu đãi đặc biệt',
            'giá cạnh tranh',
            'bảo vệ toàn diện',
            'thanh toán nhanh',
            'hỗ trợ 24/7',
            'quy trình đơn giản'
        ];
        const randomBenefit =
            benefits[Math.floor(Math.random() * benefits.length)];

        return {
            seoTitle: `${seoTitleBase} - ${randomBenefit} | Công ty Bảo hiểm`,
            metaDescription: `Mua ${seoTitleBase.toLowerCase()} với ${randomBenefit}. ${randomType} ${randomKeyword}, tư vấn miễn phí 24/7. Liên hệ ngay để nhận báo giá tốt nhất.`,
            focusKeyword: randomKeyword,
            ogType: this.getRandomOgType(),
            noindex: false,
            nofollow: false
            // canonicalUrl sẽ được tự động generate từ seoTitle
        };
    }

    // Lấy og:type ngẫu nhiên phù hợp
    private getRandomOgType(): string {
        const relevantTypes = ['article', 'product', 'website', 'business'];
        return relevantTypes[Math.floor(Math.random() * relevantTypes.length)];
    }

    ngOnInit(): void {
        // Điền dữ liệu test nếu ở chế độ develop
        this.fillTestDataIfNeeded();

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

        this.sub.add(
            this.form.valueChanges.subscribe((v) => this.valueChange.emit(v))
        );
        this.sub.add(
            this.form.statusChanges.subscribe((s) =>
                this.statusChange.emit(s as any)
            )
        );
        this.valueChange.emit(this.form.value);
        this.statusChange.emit(this.form.status as any);
    }

    ngOnChanges(): void {
        if (
            this.parentName &&
            this.createMode &&
            this.form.get('seoTitle')?.pristine
        ) {
            this.form.get('seoTitle')?.setValue(this.parentName);
        }
    }

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
            } catch (err) {}
        }

        this.form.patchValue(data);
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}

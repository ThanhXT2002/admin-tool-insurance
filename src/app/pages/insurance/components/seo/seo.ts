import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

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
        ButtonModule
    ],
    templateUrl: './seo.html',
    styleUrl: './seo.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Seo implements OnInit, OnDestroy {
    @Input() initialValue: any | null = null;
    @Output() valueChange = new EventEmitter<any>();
    @Output() statusChange = new EventEmitter<
        'VALID' | 'INVALID' | 'PENDING'
    >();

    private fb = inject(FormBuilder);
    form: FormGroup = this.fb.group({
        seoTitle: ['', Validators.required],
        metaDescription: ['', Validators.required],
        canonicalUrl: ['', Validators.required],
        focusKeyword: ['', Validators.required],
        ogType: [undefined, Validators.required],
        noindex: [false],
        nofollow: [false]
    });

    private sub = new Subscription();

    ogTypeOptions: any[] = [
        { value: 'website', label: 'Website - Trang chủ/Landing page' },

        // Content Types
        { value: 'article', label: 'Article - Bài viết/Blog (default)' },
        { value: 'blog', label: 'Blog - Danh mục blog' },

        // Products & Services
        { value: 'product', label: 'Product - Sản phẩm bảo hiểm' },
        {
            value: 'business.business',
            label: 'Business - Doanh nghiệp/Công ty'
        },

        // Media & Rich Content
        { value: 'video.other', label: 'Video - Video giới thiệu/hướng dẫn' },
        { value: 'image', label: 'Image - Hình ảnh/Infographic' },

        // Profile & About
        { value: 'profile', label: 'Profile - Trang giới thiệu/Về chúng tôi' },

        // Others
        { value: 'object', label: 'Object - Đối tượng khác' }
    ];

    ngOnInit(): void {
        if (this.initialValue) {
            this.form.patchValue(this.initialValue);
        }

        this.sub.add(
            this.form.valueChanges.subscribe((v) => this.valueChange.emit(v))
        );
        this.sub.add(
            this.form.statusChanges.subscribe((s) =>
                this.statusChange.emit(s as any)
            )
        );
        // emit initial
        this.valueChange.emit(this.form.value);
        this.statusChange.emit(this.form.status as any);
    }

    // Parent có thể gọi để bắt validate (mark touched + trả về boolean)
    validate(): boolean {
        this.form.markAllAsTouched();
        return this.form.valid;
    }

    // Parent có thể patch value nếu cần bằng ViewChild hoặc Input
    patchValue(v: any): void {
        this.form.patchValue(v ?? {});
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}

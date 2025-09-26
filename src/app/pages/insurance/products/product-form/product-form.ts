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
import { ProductApiService } from '@/pages/service/productApi.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { Product } from '@/interfaces/product.interface';
import { ProductStore } from '@/store/product/product.store';
import { MultiSelect } from 'primeng/multiselect';
import { InputNumber } from 'primeng/inputnumber';
import { Tag } from 'primeng/tag';
import { DragDropImgList } from '../../components/drag-drop-img-list/drag-drop-img-list';
import { AutoComplete } from 'primeng/autocomplete';
import { environment } from 'src/environments/environment';

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
    private productStore = inject(ProductStore);

    currentId = signal<number | undefined>(undefined);
    private previewIcon = signal<string | null>(null);

    headerTitle!: string;
    isEditMode = signal(false);
    form!: FormGroup;

    private _subs = new Subscription();
    seoData: any = null;
    seoStatus: 'VALID' | 'INVALID' | 'PENDING' = 'PENDING';
    @ViewChild(Seo) seoComp?: Seo;

    // Cờ đánh dấu đang submit để vô hiệu hóa UI trong quá trình tạo/cập nhật
    submitting = false;

    // Các trường hiển thị khi chế độ chỉnh sửa
    createdAt?: string | null = null;
    updatedAt?: string | null = null;

    // Các trường hiển thị khi chế độ chỉnh sửa
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
        this.form = this.fb.group({
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
        });

        // Effect: cập nhật tiêu đề header khi chế độ edit/create thay đổi
        effect(() => {
            this.headerTitle = this.isEditMode()
                ? 'Cập Nhật Sản Phẩm'
                : 'Thêm Sản Phẩm';
        });
    }

    // Validator: imgs phải có ít nhất 1 hình ảnh
    private imgsValidator(control: AbstractControl) {
        const value = control.value;
        if (!value || !Array.isArray(value) || value.length === 0) {
            return { required: true };
        }
        return null;
    }

    // ===== CÁC HÀM TEST DATA (CHỈ DÙNG TRONG DEVELOPMENT) =====

    // Điền dữ liệu test nếu đang ở development và chế độ create
    private fillTestDataIfNeeded(): void {
        if (!environment.production && !this.isEditMode()) {
            setTimeout(() => this.fillTestData(), 100); // Delay nhỏ để đảm bảo form đã khởi tạo
        }
    }

    // 🧪 HÀM TIỆN ÍCH: Gọi từ console để điền dữ liệu test bất kỳ lúc nào
    // Sử dụng: window.fillTestData() trong browser console
    private setupTestDataHelper(): void {
        if (!environment.production) {
            (window as any).fillTestData = () => {
                this.fillTestData();
                console.log('✅ Đã điền lại dữ liệu test từ console helper');
            };
            console.log(
                '🧪 Test helper đã sẵn sàng! Gõ "fillTestData()" trong console để điền dữ liệu test'
            );
        }
    }

    // Điền dữ liệu test vào form
    private fillTestData(): void {
        const testData = this.generateTestData();
        this.form.patchValue(testData);

        // Điền dữ liệu cho các trường đặc biệt
        this.fillTestTags();
        this.fillTestMetaKeywords();
        this.fillTestSeoData();

        console.log('✅ Đã điền dữ liệu test vào form (Development mode)');
    }

    // Tạo dữ liệu test ngẫu nhiên
    private generateTestData(): any {
        const productTypes = [
            'Bảo hiểm ô tô',
            'Bảo hiểm sức khỏe',
            'Bảo hiểm nhân thọ',
            'Bảo hiểm du lịch',
            'Bảo hiểm tài sản'
        ];
        const randomType =
            productTypes[Math.floor(Math.random() * productTypes.length)];
        const randomId = Math.floor(Math.random() * 1000);

        return {
            name: `${randomType} ${randomId}`,
            description: `Mô tả chi tiết cho ${randomType.toLowerCase()} với các tính năng ưu việt`,
            shortContent: `Tóm tắt về ${randomType.toLowerCase()} dành cho khách hàng`,
            content: this.generateRandomContent(randomType),
            price: Math.floor(Math.random() * 10000000) + 500000, // 500k - 10.5M
            coverage: Math.floor(Math.random() * 500000000) + 10000000, // 10M - 510M
            term: this.getRandomTerm(),
            targetLink: `https://example.com/${randomType.toLowerCase().replace(/\s+/g, '-')}-${randomId}`,
            targetFile: `https://example.com/${randomType.toLowerCase().replace(/\s+/g, '-')}-${randomId}`,
            details: `Chi tiết đầy đủ về ${randomType.toLowerCase()} bao gồm điều khoản và điều kiện`,
            note: `Ghi chú cho ${randomType} - cập nhật ${new Date().toLocaleDateString('vi-VN')}`,
            priority: Math.floor(Math.random() * 10),
            isHighlighted: Math.random() > 0.7,
            isFeatured: Math.random() > 0.8,
            isSaleOnline: Math.random() > 0.5,
            isPromotion: Math.random() > 0.6,
            promotionDetails:
                Math.random() > 0.6
                    ? `Khuyến mãi đặc biệt ${Math.floor(Math.random() * 50)}% off`
                    : '',
            active: true
        };
    }

    // Tạo nội dung ngẫu nhiên cho content
    private generateRandomContent(productType: string): string {
        const benefits = [
            'Bảo vệ toàn diện cho gia đình',
            'Quy trình giải quyết bồi thường nhanh chóng',
            'Hỗ trợ 24/7 trong trường hợp khẩn cấp',
            'Phí bảo hiểm cạnh tranh',
            'Mạng lưới hỗ trợ rộng khắp cả nước'
        ];

        const features = [
            'Không giới hạn số lần khám chữa bệnh',
            'Được áp dụng tại tất cả bệnh viện công và tư',
            'Thanh toán trực tiếp không cần ứng trước',
            'Bồi thường lên đến 100% chi phí điều trị',
            'Miễn thẩm định y tế cho người dưới 50 tuổi'
        ];

        return `
            <h2>Giới thiệu về ${productType}</h2>
            <p>Sản phẩm ${productType.toLowerCase()} được thiết kế đặc biệt để đáp ứng nhu cầu bảo vệ của khách hàng Việt Nam.</p>

            <h3>Lợi ích nổi bật</h3>
            <ul>
                ${benefits
                    .slice(0, 3)
                    .map((benefit) => `<li>${benefit}</li>`)
                    .join('')}
            </ul>

            <h3>Tính năng chính</h3>
            <ul>
                ${features
                    .slice(0, 3)
                    .map((feature) => `<li>${feature}</li>`)
                    .join('')}
            </ul>

            <p><strong>Liên hệ ngay hôm nay để được tư vấn chi tiết!</strong></p>
        `;
    }

    // Lấy kỳ hạn ngẫu nhiên
    private getRandomTerm(): string {
        const terms = ['1Y', '2Y', '3Y'];
        return terms[Math.floor(Math.random() * terms.length)];
    }

    // Điền test tags
    private fillTestTags(): void {
        const sampleTags = [
            'bảo hiểm',
            'sức khỏe',
            'gia đình',
            'an toàn',
            'tiết kiệm',
            'ưu đãi'
        ];
        const randomTags = sampleTags
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 4) + 2); // 2-5 tags

        this.form.get('tags')?.setValue(randomTags);
    }

    // Điền test meta keywords
    private fillTestMetaKeywords(): void {
        const sampleKeywords = [
            'bảo hiểm online',
            'mua bảo hiểm',
            'bảo hiểm giá rẻ',
            'bảo hiểm uy tín',
            'claims bảo hiểm',
            'tư vấn bảo hiểm'
        ];
        const randomKeywords = sampleKeywords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 3) + 3); // 3-5 keywords

        this.form.get('metaKeywords')?.setValue(randomKeywords);
    }

    // Điền test SEO data
    private fillTestSeoData(): void {
        const productName = this.form.get('name')?.value || 'Sản phẩm bảo hiểm';
        this.seoData = {
            title: `${productName} - Bảo hiểm uy tín, giá tốt`,
            description: `Mua ${productName.toLowerCase()} với mức giá cạnh tranh, quy trình đơn giản. Tư vấn miễn phí 24/7.`,
            keywords: `${productName.toLowerCase()}, bảo hiểm online, mua bảo hiểm`,
            ogTitle: `${productName} - Ưu đãi đặc biệt`,
            ogDescription: `Khám phá ${productName.toLowerCase()} với nhiều ưu đãi hấp dẫn`,
            ogImage: 'https://example.com/og-image.jpg'
        };
        this.seoStatus = 'VALID';
    }

    ngOnInit(): void {
        // Xử lý route parameter để load dữ liệu edit
        this.handleRouteParams();
        // Điền dữ liệu test nếu ở chế độ develop và create mode
        this.fillTestDataIfNeeded();

        // Setup helper cho console (development only)
        this.setupTestDataHelper();
    }

    // Xử lý route parameter để xác định chế độ edit và tải dữ liệu
    private handleRouteParams(): void {
        try {
            const idParam = this.route.snapshot.paramMap.get('id');
            if (idParam) {
                this.isEditMode.set(true);
                const id = Number(idParam);
                if (!isNaN(id)) {
                    this.currentId.set(id);
                    this.loadProductForEdit(id).catch((err) => {
                        console.error(
                            'Không thể tải sản phẩm để chỉnh sửa',
                            err
                        );
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Lỗi',
                            detail: 'Không thể tải chi tiết sản phẩm'
                        });
                    });
                } else {
                    console.warn('Tham số id không hợp lệ');
                }
            }
        } catch (err) {
            // bỏ qua
        }
    }

    // Tải chi tiết sản phẩm và điền dữ liệu vào form để cập nhật
    private async loadProductForEdit(id: number) {
        this.loadingService.show();
        try {
            const product: Product = await firstValueFrom(
                this.productStore.fetchById(id) as any
            );
            if (!product) throw new Error('Không tìm thấy sản phẩm');

            // Ánh xạ các trường của Product interface vào form controls bằng patchValue
            this.form.patchValue({
                name: product.name ?? '',
                description: product.description ?? '',
                shortContent: product.shortContent ?? '',
                content: product.content ?? '',
                price: product.price ?? null,
                coverage: product.coverage ?? null,
                term: product.term ?? '',
                targetLink: product.targetLink ?? '',
                targetFile: product.targetFile ?? '',
                details: product.details ?? '',
                note: product.note ?? '',
                priority: product.priority ?? 0,
                isHighlighted: !!product.isHighlighted,
                isFeatured: !!product.isFeatured,
                isSaleOnline: !!product.isSaleOnline,
                isPromotion: !!product.isPromotion,
                promotionDetails: product.promotionDetails ?? '',
                active: !!product.active
            });

            // Các mảng dữ liệu
            if (Array.isArray(product.tags))
                this.form.get('tags')?.setValue(product.tags);
            if (Array.isArray(product.metaKeywords))
                this.form.get('metaKeywords')?.setValue(product.metaKeywords);

            // Icon: backend trả về URL -> sử dụng làm preview và set control thành string
            if (product.icon) {
                try {
                    this.previewIcon.set(product.icon as any);
                    this.form.get('icon')?.setValue(product.icon);
                } catch (err) {}
            }

            // Tải hình ảnh hiện có cho drag-drop component
            if (Array.isArray(product.imgs) && product.imgs.length > 0) {
                try {
                    const existingImages = product.imgs.map(
                        (url: string, index: number) => ({
                            id: `existing-${index}`,
                            url: url,
                            file: null // hình ảnh hiện có, không có file object
                        })
                    );
                    this.form.get('imgs')?.setValue(existingImages);
                } catch (err) {
                    console.warn('Không thể tải hình ảnh hiện có:', err);
                }
            }

            // SEO meta
            if (product.seoMeta) {
                this.seoData = product.seoMeta;
                this.seoStatus = 'VALID';
            }

            // Các trường audit để hiển thị
            this.createdAt = product.createdAt ?? null;
            this.updatedAt = product.updatedAt ?? null;
            this.createdBy = (product as any)?.createdBy ?? null;
            this.updatedBy = (product as any)?.updatedBy ?? null;

            // Đánh dấu form là pristine vì chúng ta đã tải dữ liệu từ remote
            try {
                this.form.markAsPristine();
                this.form.markAsUntouched();
            } catch (err) {}
        } finally {
            try {
                this.loadingService.hide();
                console.log(
                    'Giá trị form sản phẩm sau khi tải:',
                    this.form.value
                );
            } catch (ignore) {}
        }
    }

    ngOnDestroy(): void {
        // Thu hồi object URL nếu chúng ta đã tạo để tránh memory leak
        try {
            const url = this.previewIcon();
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        } catch (err) {
            // bỏ qua
        }
        try {
            this._subs.unsubscribe();
        } catch (err) {
            // bỏ qua
        }
    }

    async submit() {
        console.log(
            '[ProductForm] Submit form, giá trị form:',
            this.form.value
        );
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

        // Hiển thị loading
        this.submitting = true;
        this.loadingService.show();

        try {
            const result = await this.performSave(payload);
            this.handleSaveSuccess(result);
        } catch (err: any) {
            console.error(
                '[ProductForm] Lỗi submit, giá trị form trước khi xử lý lỗi:',
                this.form.value,
                err
            );
            this.handleSaveError(err);
            console.log(
                '[ProductForm] Đã xử lý lỗi submit, giá trị form sau khi xử lý lỗi:',
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

    // Xây dựng payload cho Product
    private buildPayload(): any {
        const payload: any = {
            ...this.form.value,
            seoMeta: this.seoData
        };

        // Xử lý dữ liệu imgs từ drag-drop component
        this.processImgsData(payload);

        // Che giấu file cho logs
        const logged = { ...payload };
        try {
            const f = this.form.get('icon')?.value;
            logged.icon = f ? '[File]' : (payload.icon ?? null);

            // Che giấu imgs files cho logging
            if (payload.imgs && payload.imgs.length > 0) {
                logged.imgs = `[${payload.imgs.length} items: ${payload.imgs.filter((i: any) => i instanceof File).length} files + ${payload.imgs.filter((i: any) => typeof i === 'string').length} urls]`;
            }
        } catch (err) {}
        console.log('Đã chuẩn bị payload sản phẩm (preview):', logged);
        console.log('Icon file object:', this.form.get('icon')?.value ?? null);
        console.log('Dữ liệu hình ảnh:', {
            totalImages: payload.imgs?.length || 0,
            newFiles:
                payload.imgs?.filter((img: any) => img instanceof File)
                    ?.length || 0,
            existingUrls:
                payload.imgs?.filter((img: any) => typeof img === 'string')
                    ?.length || 0
        });

        return payload;
    }

    // Xử lý dữ liệu imgs từ drag-drop component
    private processImgsData(payload: any) {
        const imgsData = this.form.get('imgs')?.value || [];

        // Tạo mảng imgs mới với cả Files và URLs
        payload.imgs = [];

        if (Array.isArray(imgsData)) {
            imgsData.forEach((item: any) => {
                if (item.isNew && item.file) {
                    // File mới để upload - thêm File object
                    payload.imgs.push(item.file);
                } else if (item.url && !item.isNew) {
                    // Hình ảnh hiện có để giữ lại - thêm URL string
                    payload.imgs.push(item.url);
                }
            });
        }

        // Giữ field imgs để buildFormData có thể xử lý
        // (buildFormData sẽ tự động phân biệt File vs string)
    }

    // Thực hiện lưu và trả về record đã tạo/cập nhật hoặc null khi update
    private async performSave(payload: any): Promise<any> {
        if (this.isEditMode() && this.currentId()) {
            const id = this.currentId() as number;
            const updated = await this.productStore.update(id, payload);
            return { action: 'update', record: updated };
        } else {
            const created = await this.productStore.create(payload);
            return { action: 'create', record: created };
        }
    }

    private handleSaveSuccess(result: any) {
        if (result.action === 'update') {
            this.messageService.add({
                severity: 'success',
                summary: 'Cập nhật',
                detail: 'Cập nhật sản phẩm thành công'
            });
        } else {
            this.messageService.add({
                severity: 'success',
                summary: 'Tạo',
                detail: 'Tạo sản phẩm thành công'
            });
        }
        // Chuyển hướng về danh sách sản phẩm khi thành công
        try {
            this.router
                .navigate(['/insurance/products'], { relativeTo: this.route })
                .catch((navErr) =>
                    console.warn(
                        'Chuyển hướng đến danh sách sản phẩm thất bại',
                        navErr
                    )
                );
        } catch (navErr) {
            console.warn(
                'Chuyển hướng đến danh sách sản phẩm thất bại',
                navErr
            );
        }
    }

    private handleSaveError(err: any) {
        console.error('Lỗi khi lưu sản phẩm:', err);
        this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err?.error?.errors ?? 'Có lỗi xảy ra khi lưu sản phẩm'
        });
        // Đảm bảo loading / submitting được tắt ngay lập tức khi thất bại
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

    onFeaturedIconClick(): void {
        // Cho phép người dùng chọn một file hình ảnh, preview và đính kèm vào form
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
            const file: File = event.target.files && event.target.files[0];
            if (!file) return;

            // Thu hồi blob URL trước đó nếu có
            try {
                const prev = this.previewIcon();
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            } catch (err) {
                // bỏ qua
            }

            // Tạo object URL preview và set vào signal
            const url = URL.createObjectURL(file);
            this.previewIcon.set(url);

            // Đính kèm File vào form control để ProductService.buildFormData sẽ bao gồm nó
            this.form.get('icon')?.setValue(file);
        };
        input.click();
    }

    get tags() {
        return this.form.get('tags');
    }
    get metaKeywords() {
        return this.form.get('metaKeywords');
    }

    // Hình ảnh nổi bật hiển thị: preview khi có sẵn, ngược lại là hình ảnh mặc định
    get displayFeaturedIcon(): string {
        return this.previewIcon() ?? 'assets/images/no-img.webp';
    }
}

import {
    Component,
    forwardRef,
    Input,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    ElementRef,
    Renderer2,
    Optional,
    Self
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormsModule
} from '@angular/forms';
// NgControl intentionally not imported to avoid circular DI with NG_VALUE_ACCESSOR
import {
    NgxEditorModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    Editor,
    Toolbar
} from 'ngx-editor';

@Component({
    selector: 'app-texteditor-common',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxEditorModule],
    templateUrl: './texteditor-common.html',
    styleUrl: './texteditor-common.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TexteditorCommon),
            multi: true
        }
    ]
})
export class TexteditorCommon
    implements ControlValueAccessor, OnInit, OnDestroy, OnChanges
{
    @Input() height: number | string | null = null;
    @Input() placeholder = '';

    editor!: Editor;
    value = '';
    disabled = false;

    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['code', 'blockquote'],
        ['ordered_list', 'bullet_list'],
        [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
        ['link', 'image'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify']
    ];

    private onChange: (v: any) => void = () => {};
    private onTouched: () => void = () => {};

    // Tên lớp (scoped) gắn lên host để stylesheet được chèn chỉ tác động đến component này
    private hostScopeClass =
        'texteditor-common-' + Math.random().toString(36).slice(2, 9);
    private styleEl: HTMLStyleElement | null = null;
    // Nếu parent muốn truyền trạng thái invalid, bind vào input này
    @Input() invalid = false;

    constructor(
        private hostEl: ElementRef,
        private renderer: Renderer2
    ) {}

    ngOnInit(): void {
        this.editor = new Editor({ history: true });
        // Thêm một lớp duy nhất lên phần tử host để stylesheet chèn vào chỉ ảnh hưởng component này
        try {
            this.renderer.addClass(
                this.hostEl.nativeElement,
                this.hostScopeClass
            );
        } catch (err) {
            // Bỏ qua nếu không thể thêm lớp bằng renderer
        }

        // Áp dụng chiều cao ban đầu nếu input `height` được cung cấp
        this.applyHeightStyle();

        // Không tự động inject NgControl để tránh vòng phụ thuộc DI.
        // Nếu parent muốn component hiển thị trạng thái invalid, hãy bind [invalid] từ parent.
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['height'] && !changes['height'].firstChange) {
            this.applyHeightStyle();
        }
    }

    ngOnDestroy(): void {
        this.editor.destroy();
        // Gỡ style element đã chèn khi component bị huỷ
        if (this.styleEl && this.styleEl.parentNode) {
            try {
                this.styleEl.parentNode.removeChild(this.styleEl);
            } catch (err) {
                // Bỏ qua nếu gỡ style thất bại
            }
            this.styleEl = null;
        }
        // Không có đăng ký statusChanges để huỷ vì component không subscribe NgControl
    }

    // Trước đây component tự subscribe NgControl để tính trạng thái invalid,
    // nhưng điều này gây vòng lặp DI. Giờ parent sẽ bind [invalid] nếu cần.

    writeValue(obj: any): void {
        this.value = obj ?? '';
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Được gọi khi nội dung editor thay đổi
    onContentChange(html: string) {
        this.value = html;
        this.onChange(this.value);
    }

    // Đánh dấu control là 'touched' từ bên trong component khi user rời khỏi editor
    // Điều này sẽ kích hoạt hiển thị lỗi validation ngay khi người dùng blur khỏi editor
    public markTouched() {
        try {
            this.onTouched();
        } catch (err) {
            // ignore
        }
    }

    // Helper công khai: cho phép bên ngoài set chiều cao của editor
    setHeight(h: number | string | null) {
        this.height = h;
        this.applyHeightStyle();
    }

    private applyHeightStyle() {
        const h = this.height;

        // Nếu không có giá trị height, gỡ style đã chèn (nếu có)
        if (h === null || h === undefined || h === '') {
            if (this.styleEl && this.styleEl.parentNode) {
                try {
                    this.styleEl.parentNode.removeChild(this.styleEl);
                } catch (err) {}
                this.styleEl = null;
            }
            return;
        }

        const value = typeof h === 'number' ? `${h}px` : `${h}`;

        const css = `.${this.hostScopeClass} .NgxEditor { height: ${value} !important; min-height: ${value} !important; max-height: none !important; overflow: auto; }`;

        if (!this.styleEl) {
            // Chèn stylesheet mới nếu chưa có
            this.styleEl = document.createElement('style');
            this.styleEl.type = 'text/css';
            this.styleEl.appendChild(document.createTextNode(css));
            document.head.appendChild(this.styleEl);
        } else {
            // Thay thế nội dung CSS nếu đã tồn tại
            try {
                this.styleEl.textContent = css;
            } catch (err) {
                // Phương án dự phòng: tạo lại style element
                if (this.styleEl.parentNode) {
                    this.styleEl.parentNode.removeChild(this.styleEl);
                }
                this.styleEl = document.createElement('style');
                this.styleEl.type = 'text/css';
                this.styleEl.appendChild(document.createTextNode(css));
                document.head.appendChild(this.styleEl);
            }
        }
    }
}

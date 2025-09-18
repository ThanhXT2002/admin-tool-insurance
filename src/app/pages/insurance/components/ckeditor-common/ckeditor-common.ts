import {
    Component,
    forwardRef,
    Input,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    ElementRef,
    Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormsModule
} from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
// Import bản build classic tĩnh vì bạn chỉ sử dụng một loại build duy nhất
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
    selector: 'app-ckeditor-common',
    standalone: true,
    imports: [CommonModule, CKEditorModule, FormsModule],
    templateUrl: './ckeditor-common.html',
    styleUrl: './ckeditor-common.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CkeditorCommon),
            multi: true
        }
    ]
})
export class CkeditorCommon
    implements ControlValueAccessor, OnInit, OnDestroy, OnChanges
{
    // Tham chiếu tới instance editor (sau khi ready)
    editorInstance: any = null;
    constructor(
        private host: ElementRef,
        private renderer: Renderer2
    ) {}
    // Một class duy nhất gắn trên host để scoping stylesheet
    private _hostClass = `ckeditor-scope-${Math.random().toString(36).slice(2, 9)}`;
    private _styleEl: HTMLStyleElement | null = null;
    // Tuỳ chọn: truyền một build (module) đã import sẵn vào component
    @Input() editorBuild: any | null = null;
    // Cấu hình CKEditor (toolbar, placeholder, v.v.)
    @Input() config: any = {};
    // Chiều cao động (có thể truyền số -> hiểu là px, hoặc chuỗi css như '400px' / '50vh')
    @Input() height: number | string | null = '250px';

    editor: any = null;
    value = '';
    disabled = false;

    private onChange: (v: any) => void = () => {};
    private onTouched: () => void = () => {};

    private destroyed = false;

    async ngOnInit() {
        if (this.editorBuild) {
            this.editor = this.editorBuild;
            return;
        }
        // Sử dụng ClassicEditor đã import tĩnh ở trên
        this.editor = this.editorBuild ?? ClassicEditor;

        // Thêm class scope lên host để rule injected áp dụng đúng
        try {
            this.renderer.addClass(this.host.nativeElement, this._hostClass);
        } catch (e) {
            // ignore
        }
        // Tạo style ban đầu nếu height đã có
        this.createOrUpdateStyle(this.heightStyle);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        // Remove injected style element nếu có
        try {
            if (this._styleEl && this._styleEl.parentNode) {
                this._styleEl.parentNode.removeChild(this._styleEl);
            }
            this._styleEl = null;
        } catch (e) {
            // ignore
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['height'] && !changes['height'].firstChange) {
            // cập nhật khi height thay đổi -> cập nhật style rule
            this.createOrUpdateStyle(this.heightStyle);
        }
    }

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

    onChangeEvent(event: any) {
        // event.editor.getData() is standard
        const data = event?.editor?.getData?.() ?? event?.data ?? '';
        this.value = data;
        this.onChange(this.value);
    }

    onTouchedEvent() {
        this.onTouched();
    }

    // handler used by fallback textarea when CKEditor build is not loaded
    fallbackChange(v: string) {
        this.value = v ?? '';
        this.onChange(this.value);
    }

    // optional hook cho sự kiện ready của CKEditor
    onReady(ev: any) {
        // Sự kiện ready thường truyền object có editor
        const inst = ev?.editor ?? ev;
        this.editorInstance = inst;
        // ensure injected style exists/updated
        this.createOrUpdateStyle(this.heightStyle);
    }

    // Trả về chuỗi style height hợp lệ để bind vào template
    // (applyHeightToEditor trở thành no-op; chúng ta sử dụng stylesheet rule duy nhất)
    applyHeightToEditor(_height: string | null) {
        return;
    }

    // Tạo hoặc cập nhật một <style> trong head để override .ck-editor__editable
    createOrUpdateStyle(height: string | null) {
        if (!height) {
            if (this._styleEl && this._styleEl.parentNode) {
                this._styleEl.parentNode.removeChild(this._styleEl);
                this._styleEl = null;
            }
            return;
        }

        const css = `.${this._hostClass} .ck-editor__editable { height: ${height} !important; min-height: ${height} !important; }`;

        if (!this._styleEl) {
            this._styleEl = document.createElement('style');
            this._styleEl.type = 'text/css';
            this._styleEl.appendChild(document.createTextNode(css));
            document.head.appendChild(this._styleEl);
        } else {
            this._styleEl.textContent = css;
        }
    }

    // Phương thức công khai nếu muốn set thủ công từ cha
    setHeight(h: number | string | null) {
        this.height = h;
        this.createOrUpdateStyle(this.heightStyle);
    }

    // Trả về chuỗi style height hợp lệ để bind vào template
    get heightStyle(): string | null {
        if (this.height === null || this.height === undefined) return null;
        return typeof this.height === 'number'
            ? `${this.height}px`
            : String(this.height);
    }
}

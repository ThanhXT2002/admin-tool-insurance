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

    // host-scoped classname so the injected style only targets this component
    private hostScopeClass =
        'texteditor-common-' + Math.random().toString(36).slice(2, 9);
    private styleEl: HTMLStyleElement | null = null;

    constructor(
        private hostEl: ElementRef,
        private renderer: Renderer2
    ) {}

    ngOnInit(): void {
        this.editor = new Editor({ history: true });
        // add a unique class to the host so our injected stylesheet can scope to it
        try {
            this.renderer.addClass(
                this.hostEl.nativeElement,
                this.hostScopeClass
            );
        } catch (err) {
            // fall back silently if renderer cannot add class
        }

        // apply initial height if provided
        this.applyHeightStyle();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['height'] && !changes['height'].firstChange) {
            this.applyHeightStyle();
        }
    }

    ngOnDestroy(): void {
        this.editor.destroy();
        // remove injected style element when component destroyed
        if (this.styleEl && this.styleEl.parentNode) {
            try {
                this.styleEl.parentNode.removeChild(this.styleEl);
            } catch (err) {
                // ignore
            }
            this.styleEl = null;
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

    // called when editor content changes
    onContentChange(html: string) {
        this.value = html;
        this.onChange(this.value);
    }

    // public helper
    setHeight(h: number | string | null) {
        this.height = h;
        this.applyHeightStyle();
    }

    private applyHeightStyle() {
        const h = this.height;

        // if no height provided, remove existing style
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
            this.styleEl = document.createElement('style');
            this.styleEl.type = 'text/css';
            this.styleEl.appendChild(document.createTextNode(css));
            document.head.appendChild(this.styleEl);
        } else {
            // replace contents
            try {
                this.styleEl.textContent = css;
            } catch (err) {
                // fallback: recreate
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

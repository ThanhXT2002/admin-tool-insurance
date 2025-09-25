import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    forwardRef,
    Input,
    Output,
    ViewChild,
    ElementRef,
    OnInit
} from '@angular/core';
import {
    CdkDragDrop,
    CdkDrag,
    CdkDropList,
    moveItemInArray
} from '@angular/cdk/drag-drop';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * Reusable drag-drop image list component.
 * - Supports click-to-select files and native drag-and-drop
 * - Uses CDK DragDrop to reorder images
 * - Emits current list and implements ControlValueAccessor for reactive forms
 */
@Component({
    selector: 'app-drag-drop-img-list',
    standalone: true,
    imports: [CommonModule, CdkDropList, CdkDrag],
    templateUrl: './drag-drop-img-list.html',
    styleUrls: ['./drag-drop-img-list.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DragDropImgList),
            multi: true
        }
    ]
})
export class DragDropImgList implements OnInit, ControlValueAccessor {
    /** Initial images (urls) to display */
    @Input() initialImages: Array<string> = [];
    /** Maximum number of files allowed */
    @Input() maxFiles?: number;
    /** Emits when image list changes (array of items) */
    @Output() imagesChange = new EventEmitter<any[]>();

    @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

    // Internal representation: { url: string, file?: File, isNew?: boolean }
    imgSelected: Array<any> = [];

    private onChange: (v: any) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit(): void {
        this.imgSelected =
            this.initialImages?.map((u) => ({ url: u, isNew: false })) || [];
    }

    writeValue(obj: any): void {
        if (Array.isArray(obj)) {
            this.imgSelected = obj.map((it: any) =>
                typeof it === 'string' ? { url: it, isNew: false } : it
            );
        } else if (!obj) {
            this.imgSelected = [];
        }
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        // optional: disable interactions if needed
    }

    // Click handler to trigger hidden file input
    onClick() {
        this.fileInputRef?.nativeElement.click();
    }

    // Handle native file input change
    async onFilesSelected(ev: Event) {
        const input = ev.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        this.addFiles(Array.from(input.files));
        input.value = '';
    }

    // Public drop handler (accept FileList or array of files)
    async onFileDropped(ev: any) {
        let files: File[] = [];
        if (ev instanceof DragEvent) {
            if (ev.dataTransfer && ev.dataTransfer.files)
                files = Array.from(ev.dataTransfer.files);
            ev.preventDefault();
        } else if (ev && ev.length !== undefined) {
            files = Array.from(ev);
        }
        if (files.length === 0) return;
        this.addFiles(files);
    }

    private addFiles(files: File[]) {
        for (const f of files) {
            if (this.maxFiles && this.imgSelected.length >= this.maxFiles)
                break;
            const url = URL.createObjectURL(f);
            this.imgSelected.push({ url, file: f, isNew: true });
        }
        this.emitChange();
    }

    removeImage(item: any) {
        const idx = this.imgSelected.indexOf(item);
        if (idx >= 0) {
            // revoke object URL for new files
            if (this.imgSelected[idx].isNew && this.imgSelected[idx].url) {
                try {
                    URL.revokeObjectURL(this.imgSelected[idx].url);
                } catch {}
            }
            this.imgSelected.splice(idx, 1);
            this.emitChange();
        }
    }

    // Prevent click event from bubbling to parent (which would re-open file selector)
    onRemoveImage(event: Event, item: any) {
        event.stopPropagation();
        this.removeImage(item);
    }

    drop(event: CdkDragDrop<string[]>) {
        const previousIndex = event.previousIndex;
        const currentIndex = event.currentIndex;

        console.log(`Drag drop: from ${previousIndex} to ${currentIndex}`);

        if (previousIndex !== currentIndex) {
            // Create a copy for better change detection
            const itemsCopy = [...this.imgSelected];

            moveItemInArray(itemsCopy, previousIndex, currentIndex);

            // Update the array reference
            this.imgSelected = itemsCopy;

            console.log(
                'Updated order:',
                this.imgSelected.map((img, i) => ({
                    index: i,
                    url: img.url?.substring(0, 50) + '...'
                }))
            );

            this.emitChange();
        }
    }

    private emitChange() {
        // Emit array of items; by default return url for existing and file for new
        const output = this.imgSelected.map((it) => ({ ...it }));
        this.onChange(output);
        this.imagesChange.emit(output);
    }
}

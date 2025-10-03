import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
    OnInit,
    OnChanges
} from '@angular/core';

import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { MenuItemStore } from '@/store/menu/menuItem.store';
import { MenuItemDto } from '@/interfaces/menu.interface';

@Component({
    selector: 'app-menu-item-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        Select,
        CommonModule
    ],
    providers: [MessageService],
    templateUrl: './menu-item-form.html',
    styleUrl: './menu-item-form.scss'
})
export class MenuItemForm implements OnInit, OnChanges {
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private menuItemStore = inject(MenuItemStore);
    private messageService = inject(MessageService);

    form!: FormGroup;

    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: any | null = null; // TreeNode data structure
    @Input() categoryId!: number;

    @Output() saved = new EventEmitter<void>();

    booleanOptions = [
        { label: 'Có', value: true },
        { label: 'Không', value: false }
    ];

    submitting = false;
    private waitingForResult = false;

    constructor() {
        this.form = this.fb.group({
            categoryId: [null, [Validators.required]], // Will be set from Input
            parentId: [null], // Not required, can be null for top-level items
            label: [null, [Validators.required, Validators.maxLength(191)]],
            icon: [null],
            url: [null],
            routerLink: [null],
            command: [null],
            order: [null, [Validators.min(0), Validators.pattern('^[0-9]*$')]],
            isBlank: [false],
            expanded: [false],
            active: [true]
        });
    }

    ngOnInit(): void {
        // Initial patch will be handled by ngOnChanges when Input values are set
    }

    ngOnChanges(): void {
        // Patch form whenever inputs change (categoryId, dataEdit, isEditMode)
        console.log('MenuItemForm ngOnChanges:', {
            categoryId: this.categoryId,
            isEditMode: this.isEditMode,
            hasDataEdit: !!this.dataEdit
        });
        this.patchFromEdit();
    }

    private patchFromEdit() {
        if (!this.form || !this.categoryId) {
            console.log('MenuItemForm patchFromEdit skipped:', {
                hasForm: !!this.form,
                categoryId: this.categoryId
            });
            return; // Wait for categoryId to be set
        }

        console.log(
            'MenuItemForm patchFromEdit executing with categoryId:',
            this.categoryId
        );

        if (this.isEditMode && this.dataEdit) {
            // dataEdit is TreeNode structure with data property
            const data = this.dataEdit.data || this.dataEdit;
            this.form.patchValue({
                categoryId: this.categoryId, // Always use categoryId from Input
                parentId: data.parentId || null,
                label: data.label || null,
                icon: data.icon || null,
                url: data.url || null,
                routerLink: data.routerLink || null,
                command: data.command || null,
                order: data.order || null,
                isBlank: data.isBlank ?? false,
                expanded: data.expanded ?? false,
                active: data.active ?? true
            });
        } else {
            // Create mode - set default values
            this.form.patchValue({
                categoryId: this.categoryId, // Use categoryId from Input
                parentId: null,
                label: null,
                icon: null,
                url: null,
                routerLink: null,
                command: null,
                order: null,
                isBlank: false,
                expanded: false,
                active: true
            });
        }
        this.cdr.markForCheck();
    }

    async submit() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const payload: MenuItemDto = { ...this.form.value };

        try {
            if (this.isEditMode && this.dataEdit) {
                const itemId = this.dataEdit.data?.id || this.dataEdit.id;
                await this.menuItemStore.update(itemId, payload);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Cập nhật',
                    detail: 'Đã cập nhật menu item thành công'
                });
            } else {
                await this.menuItemStore.create(payload);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Tạo mới',
                    detail: 'Đã tạo menu item thành công'
                });
            }

            // Emit saved event and close dialog
            this.saved.emit();
            this.closeDialog();
        } catch (error) {
            console.error('Error saving menu item:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể lưu menu item'
            });
        } finally {
            this.submitting = false;
        }
    }

    onVisibleChange(v: boolean) {
        this.isShow = v;
        this.isShowChange.emit(v);

        // Reset form when dialog closes
        if (!v) {
            this.resetForm();
        }
    }

    private closeDialog() {
        this.isShow = false;
        this.isShowChange.emit(false);
        this.resetForm();
    }

    private resetForm() {
        this.submitting = false;
        this.waitingForResult = false;
        this.form.reset();
        this.patchFromEdit(); // Reset to default values
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return !!(
            control &&
            control.invalid &&
            (control.touched || control.dirty)
        );
    }
}

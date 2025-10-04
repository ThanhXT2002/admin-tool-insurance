import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
    OnInit,
    OnChanges,
    effect
} from '@angular/core';

import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TreeSelect } from 'primeng/treeselect';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { TreeNode } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { MenuItemStore } from '@/store/menu/menuItem.store';
import { MenuItemDto } from '@/interfaces/menu.interface';
import { Select } from 'primeng/select';

@Component({
    selector: 'app-menu-item-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TreeSelect,
        Select,
        CommonModule
    ],
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

    parentOptions: TreeNode[] = [];
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

        // Effect to rebuild parent options when store data changes
        effect(() => {
            const items = this.menuItemStore.items();
            if (items && items.length > 0) {
                this.buildParentOptions();
                this.cdr.markForCheck();
            }
        });
    }

    ngOnInit(): void {
        // Initial patch will be handled by ngOnChanges when Input values are set
    }

    ngOnChanges(): void {
        // Build parent options first
        this.buildParentOptions();

        // Delay patchFromEdit to ensure parentOptions is built
        setTimeout(() => {
            this.patchFromEdit();
        }, 0);
    }

    private patchFromEdit() {
        if (!this.form || !this.categoryId) {
            return; // Wait for categoryId to be set
        }

        if (this.isEditMode && this.dataEdit) {
            // dataEdit is TreeNode structure with data property
            const data = this.dataEdit.data || this.dataEdit;

            // Handle parentId properly for TreeSelect
            let parentIdValue = null;
            if (data.parentId && data.parentId !== 0) {
                // Tìm TreeNode tương ứng với parentId
                const parentNode = this.findTreeNodeByParentId(data.parentId);
                if (parentNode) {
                    // TreeSelect needs the actual TreeNode object, not just the key
                    parentIdValue = parentNode;
                }
            }

            // Set regular form values first
            this.form.patchValue({
                categoryId: this.categoryId,
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

            // Handle TreeSelect separately with delay to avoid timing issues
            setTimeout(() => {
                const parentControl = this.form.get('parentId');
                if (parentControl) {
                    if (parentIdValue) {
                        parentControl.setValue(parentIdValue);
                    } else {
                        parentControl.setValue(null);
                    }
                    this.cdr.detectChanges();
                }
            }, 200);
        } else {
            // Create mode - set default values
            this.form.patchValue({
                categoryId: this.categoryId,
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

            // Handle TreeSelect separately
            const parentControl = this.form.get('parentId');
            if (parentControl) {
                parentControl.setValue(null);
            }
        }
        this.cdr.markForCheck();
    }

    async submit() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const formValue = { ...this.form.value };

        // Extract parent ID using helper method
        const parentIdValue = this.extractParentId(formValue.parentId);
        formValue.parentId = parentIdValue;

        const payload: MenuItemDto = formValue;

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

    /**
     * Build parent options from store data, excluding current item when editing
     */
    private buildParentOptions() {
        const storeItems = this.menuItemStore.items();
        if (!storeItems || storeItems.length === 0) {
            this.parentOptions = [];
            return;
        }

        // Get current item ID if editing
        const currentItemId =
            this.isEditMode && this.dataEdit
                ? this.dataEdit.data?.id || this.dataEdit.id
                : null;

        // Convert to TreeNode structure and filter out current item
        this.parentOptions = this.buildTreeNodes(storeItems, currentItemId);
    }

    /**
     * Convert MenuItem[] to TreeNode[] for TreeSelect, excluding specified itemId
     */
    private buildTreeNodes(items: any[], excludeId?: number): TreeNode[] {
        return items
            .filter((item) => item.id !== excludeId) // Exclude current item
            .map((item) => {
                const node: TreeNode = {
                    key: item.id.toString(),
                    label: item.label,
                    data: item.id, // Store just the ID for easy access
                    icon: item.icon || undefined,
                    leaf: !item.children || item.children.length === 0,
                    expanded: true, // Auto expand all nodes
                    children:
                        item.children && item.children.length > 0
                            ? this.buildTreeNodes(item.children, excludeId)
                            : undefined
                };
                return node;
            });
    }

    /**
     * Tìm TreeNode theo parentId từ parentOptions
     */
    private findTreeNodeByParentId(
        parentId: number | string,
        nodes: TreeNode[] = this.parentOptions
    ): TreeNode | null {
        if (!nodes || nodes.length === 0) {
            return null;
        }

        const searchId = parentId.toString();

        for (const node of nodes) {
            if (node.key === searchId) {
                return node;
            }

            // Tìm trong children nếu có
            if (node.children && node.children.length > 0) {
                const found = this.findTreeNodeByParentId(
                    parentId,
                    node.children
                );
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return !!(
            control &&
            control.invalid &&
            (control.touched || control.dirty)
        );
    }

    /**
     * Helper method to extract parent ID from TreeSelect value
     */
    private extractParentId(treeSelectValue: any): number | null {
        if (!treeSelectValue) {
            return null;
        }

        // Handle different value types from TreeSelect
        if (typeof treeSelectValue === 'string') {
            const parsed = parseInt(treeSelectValue, 10);
            return isNaN(parsed) ? null : parsed;
        }

        if (typeof treeSelectValue === 'number') {
            return treeSelectValue;
        }

        if (typeof treeSelectValue === 'object') {
            if (treeSelectValue.key) {
                const parsed = parseInt(treeSelectValue.key, 10);
                return isNaN(parsed) ? null : parsed;
            }
            if (treeSelectValue.data && treeSelectValue.data.id) {
                return treeSelectValue.data.id;
            }
        }

        if (Array.isArray(treeSelectValue) && treeSelectValue.length > 0) {
            return this.extractParentId(treeSelectValue[0]);
        }

        return null;
    }
}

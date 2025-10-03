import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    Input,
    Output
} from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Button } from 'primeng/button';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-menu-item-form',
    imports: [
        DrawerModule,
        Toolbar,
        Button,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        Select,
        CommonModule
    ],
    templateUrl: './menu-item-form.html',
    styleUrl: './menu-item-form.scss'
})
export class MenuItemForm {
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    form!: FormGroup;

    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: MenuItem | null = null;

    @Output() saved = new EventEmitter<void>();

    booleanOptions = [
        { label: 'Có', value: true },
        { label: 'Không', value: false }
    ];

    submitting = false;
    private waitingForResult = false;

    constructor() {
        this.form = this.fb.group({
            categoryId: [null],
            parentId: [undefined, [Validators.required]],
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
        this.patchFromEdit();

        // effect moved to constructor (must run in an injection context)
    }

    ngOnChanges(): void {
        this.patchFromEdit();
    }

    private patchFromEdit() {
        if (!this.form) return;
        const data = this.dataEdit;
        this.form.patchValue({
            //  categoryId: data?.['categoryId'] || null,
            //  parentId: data?.['data']?.parentId || null,
            //  label: data?.label || null,
            //   icon: data?.['data']?.icon || null,
            //   url: data?.['data']?.url || null,
            //   routerLink: data?.['data']?.routerLink || null,
            //   command: data?.['data']?.command || null,
            //   order: data?.['data']?.order || null,
            //   isBlank: data?.['data']?.isBlank ?? false,
            //   expanded: data?.['data']?.expanded ?? false,
            //   active: data?.['data']?.active ?? true
        });
        this.cdr.markForCheck();
    }

    submit() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const payload = { ...this.form.value };

        if (this.isEditMode && this.dataEdit?.id) {
            // this.facade.update(this.dataEdit.id, payload);
        } else {
            // this.facade.create(payload);
        }

        // wait for the effect/store result before closing
        this.waitingForResult = true;
    }

    onVisibleChange(v: boolean) {
        this.isShow = v;
        this.isShowChange.emit(v);
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

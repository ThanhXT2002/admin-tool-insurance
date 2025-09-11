import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { PermissionsFacade } from '@/store/permissions/permissions.facade';
import { Permission } from '@/interfaces/permission.interface';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-permission-form',
    standalone: true,
    imports: [DrawerModule, ReactiveFormsModule, InputTextModule, FloatLabelModule, TextareaModule, ButtonModule, NgClass],
    templateUrl: './permission-form.html',
    styleUrls: ['./permission-form.scss']
})
export class PermissionForm implements OnInit {
    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: Permission | null = null;

    @Output() saved = new EventEmitter<void>();

    form!: FormGroup;
    submitting = false;
    // when true we're waiting for the store/effect result for the last submit
    private waitingForResult = false;

    private fb = new FormBuilder();

    constructor(
        private cdr: ChangeDetectorRef,
        private facade: PermissionsFacade
    ) {
      effect(() => {
        // read signals so effect re-runs when loading/error change
        const loading = this.facade.loading();
        const error = this.facade.error();
        if (this.waitingForResult && !loading) {
            this.waitingForResult = false;
            this.submitting = false;
            if (!error) {
                // success -> close and emit saved
                this.isShowChange.emit(false);
                this.saved.emit();
                if (this.form) this.form.reset();
            } else {
                // failure -> keep drawer open; notifications are handled by effects
            }
        }
    });
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            key: ['', [Validators.required]],
            name: ['', [Validators.required]],
            description: ['']
        });

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
            key: data?.key || '',
            name: data?.name || '',
            description: data?.description || ''
        });
        this.cdr.markForCheck();
    }

    onVisibleChange(v: boolean) {
        this.isShow = v;
        this.isShowChange.emit(v);
    }

    submit() {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const payload = { ...this.form.value };

        if (this.isEditMode && this.dataEdit?.id) {
            this.facade.update(this.dataEdit.id, payload);
        } else {
            this.facade.create(payload);
        }

        // wait for the effect/store result before closing
        this.waitingForResult = true;
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }
}

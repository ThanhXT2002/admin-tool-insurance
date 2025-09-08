import { Component, EventEmitter, inject, input, Input, Output, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-post-category-form',
    imports: [DrawerModule, ReactiveFormsModule, InputTextModule, FloatLabelModule, TextareaModule, Select,ToggleSwitchModule, ButtonModule],
    templateUrl: './post-category-form.html',
    styleUrl: './post-category-form.scss'
})
export class PostCategoryForm {
    // nhận WritableSignal từ parent (có .set)
    @Input() isShow!: WritableSignal<boolean>;
    headerTitle: string = 'Thêm Danh Mục Bài Viết';

    private fb = inject(FormBuilder);

    onVisibleChange(v: boolean) {
        this.isShow.set(v);
    }

    form!: FormGroup;
    submitting = false;
    isEditMode = false;

    constructor() {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            parentId: [undefined],
            active: [true],
            description: ['']
        });
        this.isEditMode == true ? this.headerTitle = 'Cập Nhật Danh Mục Bài Viết' : this.headerTitle = 'Thêm Danh Mục Bài Viết';
    }

    get name() {
        return this.form.get('name');
    }

    submit() {
        if (this.form.valid) {

            console.log(this.form.value);

            this.submitting = true;
            if (this.isEditMode) {
                // this.update();
            } else {
                // this.create();
            }
        } else {
            this.form.markAllAsTouched();
        }
    }

    create() {
    // this.statusService.createStatus(this.form.value).subscribe({
    //   next: () => {
    //     this.toastrService.success(this.translateService.instant('toast.create_success'), '', {
    //       positionClass: 'toast-top-left',
    //     });
    //     this.submitting = false;
    //     this.form.reset();
    //     this.refreshService.triggerRefresh();

    //   },
    //   error: (err) => {
    //     this.submitting = false;
    //     this.toastrService.error(this.translateService.instant('toast.create_failed'), '', {
    //       positionClass: 'toast-top-left',
    //     });
    //   },
    // });
  }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }
}

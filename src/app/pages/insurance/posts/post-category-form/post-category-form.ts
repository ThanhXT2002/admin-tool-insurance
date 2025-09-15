import {
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
    ViewChild
} from '@angular/core';
import {
    FormArray,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { Seo } from '../../components/seo/seo';

@Component({
    selector: 'app-post-category-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        Select,
        ToggleSwitchModule,
        ButtonModule,
        Seo
    ],
    templateUrl: './post-category-form.html',
    styleUrl: './post-category-form.scss'
})
export class PostCategoryForm {
    headerTitle: string = 'Thêm Danh Mục Bài Viết';

    private fb = inject(FormBuilder);

    isEditMode = false;

    form!: FormGroup;
    submitting = false;
    // SEO data and status coming from child component
    seoData: any = null;
    seoStatus: 'VALID' | 'INVALID' | 'PENDING' = 'PENDING';

    @ViewChild(Seo) seoComp?: Seo;
    // isEditMode handled via @Input

    constructor() {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            parentId: [undefined],
            order: [0],
            active: [true],
            description: ['']
        });
        this.headerTitle = this.isEditMode
            ? 'Cập Nhật Danh Mục Bài Viết'
            : 'Thêm Danh Mục Bài Viết';
    }


    submit() {
        // mark parent controls
        this.form.markAllAsTouched();

        // validate child (mark touched and get boolean)
        const childValid = this.seoComp
            ? this.seoComp.validate()
            : this.seoStatus === 'VALID';

        if (this.form.valid && childValid) {
            const payload = {
                ...this.form.value,
                metaSeo: this.seoData
            };
            console.log(payload);

            this.submitting = true;
            if (this.isEditMode) {
                // this.update(payload);
            } else {
                // this.create(payload);
            }
            // this.saved.emit();
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

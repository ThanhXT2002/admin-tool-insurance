import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    Output,
    effect
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MenuCateStore } from '@/store/menu/menuCate.store';
import { MenuCategory } from '@/interfaces/menu.interface';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { inject } from '@angular/core';

@Component({
    selector: 'app-menu-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        CommonModule,
        DividerModule,
        TextareaModule,
        ToggleSwitch
    ],
    templateUrl: './menu-form.html',
    styleUrl: './menu-form.scss'
})
export class MenuForm {
    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: MenuCategory | null = null;

    @Output() saved = new EventEmitter<void>();

    form!: FormGroup;
    submitting = false;
    // when true we're waiting for the store/effect result for the last submit
    private waitingForResult = false;

    private fb = new FormBuilder();
    private menuStore = inject(MenuCateStore);

    constructor(private cdr: ChangeDetectorRef) {
        effect(() => {
            // read signals so effect re-runs when loading/error change
            const loading = this.menuStore.loading();
            const error = this.menuStore.error();
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
            key: [
                '',
                [Validators.required, Validators.pattern(/^[a-z][a-z0-9\-]*$/)]
            ],
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: [''],
            position: [''], // Không yêu cầu và không giới hạn giá trị
            active: [true]
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
            description: data?.description || '',
            position: data?.position || '',
            active: data?.active ?? true
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
            this.menuStore.update(this.dataEdit.id, payload);
        } else {
            this.menuStore.create(payload);
        }

        // wait for the effect/store result before closing
        this.waitingForResult = true;
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }
}

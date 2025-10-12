import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    Output,
    effect,
    inject
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
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { VehicleTypeStore } from '@/store/vehicle-type/vehicle-type.store';
import {
    VehicleType as VehicleTypeModel,
    UsageType,
    UsagePurpose
} from '@/interfaces/vehicle-type.interface';
import { CommonModule } from '@angular/common';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Select } from 'primeng/select';

@Component({
    selector: 'app-vehicle-type-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        FloatLabelModule,
        ButtonModule,
        CommonModule,
        TextareaModule,
        ToggleSwitch,
        Select
    ],
    templateUrl: './vehicle-type-form.html',
    styleUrl: './vehicle-type-form.scss'
})
export class VehicleTypeForm {
    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: VehicleTypeModel | null = null;

    @Output() saved = new EventEmitter<void>();

    form!: FormGroup;
    submitting = false;
    // when true we're waiting for the store/effect result for the last submit
    private waitingForResult = false;

    private fb = new FormBuilder();
    private vehicleTypeStore = inject(VehicleTypeStore);

    // Dropdown options
    usageTypeOptions = [
        { name: 'Ô tô kinh doanh vận tải', code: 'OTOKKDVT' },
        { name: 'Ô tô không kinh doanh vận tải', code: 'OTOKDVT' },
        { name: 'Xe máy', code: 'XEMAY' },
        { name: 'Vỏ chai xe ô tô', code: 'VCXOTO' }
    ];

    usagePurposeOptions = [
        { name: 'Xe chở người', code: 'XCN' },
        { name: 'Xe chở hàng', code: 'XCH' },
        { name: 'Xe chở người và chở hàng', code: 'XCN_CH' }
    ];

    constructor(private cdr: ChangeDetectorRef) {
        effect(() => {
            // read signals so effect re-runs when loading/error change
            const loading = this.vehicleTypeStore.loading();
            const error = this.vehicleTypeStore.error();
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
            vehicleTypeCode: [
                '',
                [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]
            ],
            vehicleTypeName: [
                '',
                [Validators.required, Validators.minLength(2)]
            ],
            usageType: ['', Validators.required],
            usagePurpose: ['', Validators.required],
            seatMin: [0],
            seatMax: [0],
            weightMin: [0],
            weightMax: [0],
            isShowSeat: [false],
            isShowWeight: [false],
            pricePerYear: [0, [Validators.required, Validators.min(0)]],
            active: [true]
        });

        this.patchFromEdit();
    }

    ngOnChanges(): void {
        this.patchFromEdit();
    }

    private patchFromEdit() {
        if (!this.form) return;
        const data = this.dataEdit;
        this.form.patchValue({
            vehicleTypeCode: data?.vehicleTypeCode || '',
            vehicleTypeName: data?.vehicleTypeName || '',
            usageType: data?.usageType || '',
            usagePurpose: data?.usagePurpose || '',
            seatMin: data?.seatMin || 0,
            seatMax: data?.seatMax || 0,
            weightMin: data?.weightMin || 0,
            weightMax: data?.weightMax || 0,
            isShowSeat: data?.isShowSeat ?? false,
            isShowWeight: data?.isShowWeight ?? false,
            pricePerYear: data?.pricePerYear || 0,
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
            this.vehicleTypeStore.update(this.dataEdit.id, payload);
        } else {
            this.vehicleTypeStore.create(payload);
        }

        // wait for the effect/store result before closing
        this.waitingForResult = true;
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }
}

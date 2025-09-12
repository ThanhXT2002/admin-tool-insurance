import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    effect,
    inject,
    signal
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
import { PermissionsFacade } from '@/store/permissions/permissions.facade';
import { Permission } from '@/interfaces/permission.interface';
import { CommonModule } from '@angular/common';
import { User } from '@/pages/service/user.service';
import { PasswordValidators } from '@/validators/password.validator';
import { PasswordModule } from 'primeng/password';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DividerModule } from 'primeng/divider';
import { UserRoleFacade } from '@/store/user-role/user-role.facade';
import { userRole } from '@/pages/service/user-role.service';
import { MultiSelect } from 'primeng/multiselect';
import { PickList } from 'primeng/picklist';
import { UserFacade } from '@/store/user/user.facade';

@Component({
    selector: 'app-user-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        ButtonModule,
        CommonModule,
        PasswordModule,
        InputIconModule,
        IconFieldModule,
        DividerModule,
        MultiSelect,
        PickList
    ],
    templateUrl: './user-form.html',
    styleUrl: './user-form.scss'
})
export class UserForm implements OnInit {
    // === INPUT/OUTPUT Properties ===
    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: User | null = null;

    @Output() saved = new EventEmitter<void>();

    // === Form Properties ===
    form!: FormGroup;
    loading = false;
    private waitingForResult = false;

    // === Services ===
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private facade = inject(UserFacade);
    private roleFacade = inject(UserRoleFacade);
    private permissionFacade = inject(PermissionsFacade);

    // === Data Properties ===
    roles = signal<userRole[]>([]);
    listPermissions: Permission[] = [];
    sourcePermissions: Permission[] = [];
    targetPermissions: Permission[] = [];

    // === Avatar Properties ===
    private selectedAvatarFile?: File | null = null;
    private avatarPreview?: string;

    // === Constructor ===
    constructor() {
        // Effect để đồng bộ roles từ facade
        effect(() => {
            const rs = this.roleFacade.roles();
            this.roles.set(rs ?? []);
        });

        // Effect để xử lý kết quả submit
        effect(() => {
            const loading = this.facade.loading();
            const error = this.facade.error();

            if (this.waitingForResult && !loading) {
                this.waitingForResult = false;
                this.loading = false;

                if (!error) {
                    // Thành công -> đóng form và emit saved
                    this.closeForm();
                    this.saved.emit();
                }
            }
        });

        // Effect để đồng bộ permissions
        effect(() => {
            const perms = this.permissionFacade.permissions();
            this.listPermissions = perms ?? [];
            this.setupPermissions();
        });
    }

    // === Lifecycle Methods ===
    ngOnInit(): void {
        this.createForm();
        this.loadInitialData();
    }

    // === Public Methods ===

    /**
     * Xử lý khi drawer hiển thị/ẩn
     */
    onVisibleChange(visible: boolean): void {
        this.isShow = visible;
        this.isShowChange.emit(visible);

        if (visible) {
            this.resetForm();
            this.setupFormForMode();
            this.fillDataIfEdit();
        }
    }

    /**
     * Xử lý khi chọn file avatar
     */
    onAvatarFileChange(file?: File | null): void {
        if (!file) {
            this.selectedAvatarFile = null;
            this.avatarPreview = undefined;
            return;
        }

        this.selectedAvatarFile = file;

        // Tạo preview URL
        const reader = new FileReader();
        reader.onload = () => {
            this.avatarPreview = reader.result as string;
            this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Lấy URL avatar hiển thị
     */
    get avatarUrl(): string {
        return (
            this.avatarPreview ||
            this.dataEdit?.avatarUrl ||
            '/assets/images/avatar-default.webp'
        );
    }

    /**
     * Kiểm tra field có lỗi không
     */
    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!(control?.invalid && control.touched);
    }

    /**
     * Xử lý submit form
     */
    submit(): void {
        if (!this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const payload = this.buildPayload();

        if (this.isEditMode && this.dataEdit?.id) {
            this.facade.update(this.dataEdit.id, payload);
        } else {
            this.facade.create(payload);
        }

        this.waitingForResult = true;
    }

    /**
     * Xử lý khi move permissions
     */
    onMoveToTarget(event: { items: Permission[] }): void {
        this.targetPermissions = [...this.targetPermissions];
    }

    onMoveToSource(event: { items: Permission[] }): void {
        this.targetPermissions = [...this.targetPermissions];
    }

    // === Private Methods ===

    /**
     * Tạo form cơ bản
     */
    private createForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            confirmPassword: [''],
            phoneNumber: [''],
            addresses: [''],
            roleKeys: ['', [Validators.required]],
            permissionKeys: ['']
        });
    }

    /**
     * Load dữ liệu ban đầu
     */
    private loadInitialData(): void {
        this.roleFacade.load({ page: 1 });
        this.permissionFacade.load({ page: 1 });
    }

    /**
     * Reset form về trạng thái ban đầu
     */
    private resetForm(): void {
        this.form.reset();
        this.selectedAvatarFile = null;
        this.avatarPreview = undefined;
        this.targetPermissions = [];
        this.sourcePermissions = [...this.listPermissions];
    }

    /**
     * Setup form dựa theo mode (add/edit)
     */
    private setupFormForMode(): void {
        const passwordControl = this.form.get('password');
        const confirmPasswordControl = this.form.get('confirmPassword');
        const emailControl = this.form.get('email');

        if (this.isEditMode) {
            // Edit mode: Không yêu cầu password, disable email
            passwordControl?.clearValidators();
            confirmPasswordControl?.clearValidators();
            emailControl?.disable();
            this.form.clearValidators();
        } else {
            // Add mode: Yêu cầu password, enable email
            passwordControl?.setValidators([
                Validators.required,
                Validators.minLength(8),
                Validators.maxLength(16),
                ...PasswordValidators.strongPassword()
            ]);
            confirmPasswordControl?.setValidators([Validators.required]);
            emailControl?.enable();
            this.form.setValidators(PasswordValidators.passwordMatch());
        }

        // Update validators
        passwordControl?.updateValueAndValidity();
        confirmPasswordControl?.updateValueAndValidity();
        emailControl?.updateValueAndValidity();
        this.form.updateValueAndValidity();
    }

    /**
     * Fill dữ liệu nếu ở edit mode
     */
    private fillDataIfEdit(): void {
        if (!this.isEditMode || !this.dataEdit) return;

        this.form.patchValue({
            email: this.dataEdit.email,
            name: this.dataEdit.name || '',
            phoneNumber: this.dataEdit.phoneNumber || '',
            addresses: this.dataEdit.addresses || '',
            roleKeys: this.dataEdit.roleKeys || [],
            active: this.dataEdit.active || false
        });
    }

    /**
     * Setup permissions list
     */
    private setupPermissions(): void {
        this.sourcePermissions = [...this.listPermissions];

        if (this.isEditMode && this.dataEdit?.permissionKeys?.length) {
            const editKeys = this.dataEdit.permissionKeys;

            this.targetPermissions = editKeys
                .map((key) => {
                    if (typeof key === 'number') {
                        return this.listPermissions.find((p) => p.id === key);
                    } else {
                        return this.listPermissions.find(
                            (p) => (p as any).key === key
                        );
                    }
                })
                .filter(Boolean) as Permission[];

            const targetIds = new Set(this.targetPermissions.map((p) => p.id));
            this.sourcePermissions = this.listPermissions.filter(
                (p) => !targetIds.has(p.id)
            );
        } else {
            this.targetPermissions = [];
        }

        this.cdr.markForCheck();
    }

    /**
     * Xây dựng payload để gửi API
     */
    private buildPayload(): any {
        console.log('🔍 DEBUG Frontend - form.value:', this.form.value);
        console.log(
            '🔍 DEBUG Frontend - form.value.addresses:',
            this.form.value.addresses
        );

        const payload = { ...this.form.value };

        console.log('🔍 DEBUG Frontend - payload before processing:', payload);
        console.log(
            '🔍 DEBUG Frontend - payload.addresses:',
            payload.addresses
        );

        // Xóa confirm password
        delete payload.confirmPassword;

        // Xóa password nếu edit mode
        if (this.isEditMode) {
            delete payload.password;
        }

        // Thêm permission keys
        if (this.targetPermissions.length > 0) {
            const sample = this.targetPermissions[0];
            if ((sample as any).key) {
                payload.permissionKeys = this.targetPermissions.map(
                    (p) => (p as any).key
                );
            } else {
                payload.permissionKeys = this.targetPermissions.map(
                    (p) => p.id
                );
            }
        } else {
            payload.permissionKeys = [];
        }

        // Thêm avatar file
        if (this.selectedAvatarFile) {
            payload.avatar = this.selectedAvatarFile;
        }

        console.log('🔍 DEBUG Frontend - final payload:', payload);
        console.log(
            '🔍 DEBUG Frontend - final payload.addresses:',
            payload.addresses
        );

        return payload;
    }

    /**
     * Đóng form và reset
     */
    private closeForm(): void {
        this.isShowChange.emit(false);
        this.resetForm();
    }
}

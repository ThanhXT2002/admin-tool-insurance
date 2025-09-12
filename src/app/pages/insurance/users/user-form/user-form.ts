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
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { PermissionsFacade } from '@/store/permissions/permissions.facade';
import { Permission } from '@/interfaces/permission.interface';
import { CommonModule, NgClass } from '@angular/common';
import { User } from '@/pages/service/user.service';
import { PasswordValidators } from '@/validators/password.validator';
import { PasswordModule } from 'primeng/password';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DividerModule } from 'primeng/divider';
import { Select } from 'primeng/select';
import { UserRoleFacade } from '@/store/user-role/user-role.facade';
import { userRole } from '@/pages/service/user-role.service';
import { MultiSelect } from 'primeng/multiselect';
import { PickList } from 'primeng/picklist';
@Component({
    selector: 'app-user-form',
    imports: [
        DrawerModule,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        ButtonModule,
        NgClass,
        FloatLabelModule,
        PasswordModule,
        CommonModule,
        InputGroupAddonModule,
        InputIconModule,
        IconFieldModule,
        InputTextModule,
        DividerModule,
        MultiSelect,
        PickList
    ],
    templateUrl: './user-form.html',
    styleUrl: './user-form.scss'
})
export class UserForm {
    @Input() isShow = false;
    @Output() isShowChange = new EventEmitter<boolean>();

    @Input() isEditMode = false;
    @Input() dataEdit: User | null = null;

    @Output() saved = new EventEmitter<void>();

    private roleFacade = inject(UserRoleFacade) as UserRoleFacade;
    roles = signal<userRole[]>([]);

    // sync roles từ facade vào signal local
    private _syncRoles = effect(() => {
        const rs = this.roleFacade.roles();
        this.roles.set(rs ?? []);
    });

    private permissionFacade = inject(PermissionsFacade) as PermissionsFacade;

    listPermissions!: Permission[];
    sourcePermissions!: Permission[];
    targetPermissions!: Permission[];

    form!: FormGroup;
    loading = false;
    // when true we're waiting for the store/effect result for the last submit
    private waitingForResult = false;

    private fb = new FormBuilder();

    get avatarUrl(): string | undefined {
        // If user selected a preview file, show it; otherwise show existing avatarUrl from edit data or default
        const preview = (this as any)._avatarPreview as string | undefined;
        if (preview) return preview;
        const existing = this.dataEdit?.avatarUrl;
        return existing ?? '/assets/images/avatar-default.webp';
    }

    // local selected avatar file (not part of reactive form control)
    private _selectedAvatarFile?: File | null = null;

    // called when user picks a file
    onAvatarFileChange(file?: File | null) {
        if (!file) {
            this._selectedAvatarFile = null;
            (this as any)._avatarPreview = undefined;
            this.cdr.markForCheck();
            return;
        }
        this._selectedAvatarFile = file;
        // create preview url
        const reader = new FileReader();
        reader.onload = () => {
            (this as any)._avatarPreview = reader.result as string;
            this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
    }

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
                this.loading = false;
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
        this.form = this.fb.group(
            {
                name: ['', [Validators.required]],
                email: ['', [Validators.required]],
                password: [
                    '',
                    [
                        Validators.required,
                        Validators.minLength(8),
                        Validators.maxLength(16),
                        ...PasswordValidators.strongPassword()
                    ]
                ],
                confirmPassword: ['', [Validators.required]],
                phoneNumber: [''],
                addresses: [''],
                roleKeys: ['', [Validators.required]],
                permissionKeys: ['']
            },
            {
                validators: PasswordValidators.passwordMatch()
            }
        );

        this.roleFacade.load({ page: 1 });
        this.permissionFacade.load({ page: 1 });

        this.patchFromEdit();
    }

    ngOnChanges(): void {
        this.patchFromEdit();
    }

    private _syncPermsEffect = effect(() => {
        const perms = this.permissionFacade.permissions();
        this.listPermissions = perms ?? [];

        // default source = all permissions
        this.sourcePermissions = this.listPermissions.slice();

        // if editing, map dataEdit.permissionKeys (could be ids or keys) -> Permission[]
        const editKeys = this.dataEdit?.permissionKeys || [];
        if (Array.isArray(editKeys) && editKeys.length > 0) {
            const byId = new Map<number, Permission>();
            this.listPermissions.forEach((p) => byId.set(p.id, p));

            // detect whether items are numbers (ids) or strings (keys)
            const isNumericKeys = typeof editKeys[0] === 'number';

            this.targetPermissions = (editKeys || [])
                .map((k) => {
                    if (isNumericKeys) {
                        return byId.get(k as unknown as number) || null;
                    } else {
                        return (
                            this.listPermissions.find(
                                (p) => (p as any).key === (k as string)
                            ) || null
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
    });

    private patchFromEdit() {
        if (!this.form) return;
        const data = this.dataEdit;
        this.form.patchValue({
            email: data?.email || '',
            name: data?.name || '',
            phoneNumber: data?.phoneNumber || '',
            addresses: data?.addresses || '',
            roleKeys: data?.roleKeys || [],
            permissionKeys: data?.permissionKeys || [],
            active: data?.active || false
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

        this.loading = true;
        const payload = { ...this.form.value };

        // đảm bảo permissionKeys gửi là mảng key string (backend đang dùng permissionKeys)
        if (Array.isArray(this.targetPermissions)) {
            // nếu Permission có field 'key' dùng key, nếu không dùng id
            const sample = this.targetPermissions[0];
            if (sample && (sample as any).key) {
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

        // attach avatar file if present (facade will dispatch and effect will call service)
        if (this._selectedAvatarFile) {
            // include File in payload under 'avatar' so UserService.buildFormData will append it
            (payload as any).avatar = this._selectedAvatarFile;
        }

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

    onMoveToTarget(event: { items: Permission[] }) {
        this.targetPermissions = [...this.targetPermissions];
    }

    onMoveToSource(event: { items: Permission[] }) {
        this.targetPermissions = [...this.targetPermissions];
    }
}

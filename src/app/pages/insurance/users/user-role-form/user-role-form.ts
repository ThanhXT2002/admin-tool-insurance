import { ChangeDetectorRef, Component, effect, EventEmitter, inject, input, Input, OnInit, Output, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { UserRoleService } from '@/pages/service/user-role.service';
import { UserRoleFacade } from '@/store/user-role/user-role.facade';
import { RefreshService } from '@/pages/service/refresh.service';
import { MessageService } from 'primeng/api';
import { NgClass } from '@angular/common';
import { PickListModule } from 'primeng/picklist';
import { PermissionService } from '@/pages/service/permission.service';
import { Permission } from '@/interfaces/permission.interface';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-user-role-form',
    imports: [DrawerModule, ReactiveFormsModule, InputTextModule, FloatLabelModule, TextareaModule, PickListModule, ToggleSwitchModule, ButtonModule, NgClass],
    templateUrl: './user-role-form.html',
    styleUrl: './user-role-form.scss'
})
export class UserRoleForm implements OnInit {
    userRoleService = inject(UserRoleService);
    private messageService = inject(MessageService);
    private facade = inject(UserRoleFacade) as UserRoleFacade;
    private permissionService = inject(PermissionService);

    headerTitle!: string;
    listPermissions!: Permission[];
    sourcePermissions!: Permission[];

    targetPermissions!: Permission[];

    private fb = inject(FormBuilder);
    private permSub: Subscription | null = null;

    onVisibleChange(v: boolean) {
        this.userRoleService.isShowForm.set(v);
    }

    roleId = signal(0);

    form!: FormGroup;
    loading = false;
    private waitingForResult = false;

    constructor(private cdr: ChangeDetectorRef) {
        this.roleId = signal(this.userRoleService.dataEditItem()?.id || 0);
        this.form = this.fb.group({
            key: ['', [Validators.required]],
            name: ['', [Validators.required]],
            description: ['']
        });
        effect(() => {
            this.userRoleService.isEditMode() ? (this.headerTitle = 'Cập Nhật Danh Quyền Hạn') : (this.headerTitle = 'Thêm Danh Quyền Hạn');
            const dataEdit = this.userRoleService.dataEditItem();
            this.form.patchValue({
                key: dataEdit?.key || '',
                name: dataEdit?.name || '',
                description: dataEdit?.description || ''
            });
            // react to dataEditItem id changes via effect
            const id = dataEdit?.id;
            if (id) {
                this.loadRolePermissions(id);
            } else {
                // reset picklist for create mode
                this.targetPermissions = [];
                this.sourcePermissions = this.listPermissions?.slice() || [];
                this.cdr.markForCheck();
            }
        });

        // watch facade loading/error to close drawer only after success
        effect(() => {
            const loading = this.facade.loading();
            const error = this.facade.error();
            if (this.waitingForResult && !loading) {
                this.waitingForResult = false;
                this.loading = false;
                if (!error) {
                    this.userRoleService.isShowForm.set(false);
                    this.form.reset();
                    this.targetPermissions = [];
                    this.sourcePermissions = this.listPermissions?.slice() || [];
                } else {
                    // keep form open; NotificationEffects will show error
                }
            }
        });
    }

    ngOnInit() {
        this.loadAllPermissions();
    }

    ngOnDestroy(): void {
        this.permSub?.unsubscribe();
    }

    private loadRolePermissions(roleId: number) {
        // cancel previous
        this.permSub?.unsubscribe();
        this.loading = true;
        this.permSub = this.userRoleService.getRolePermissions(roleId).subscribe({
            next: (res) => {
                const returned = res.data || [];
                // Try to map returned permission objects to the instances from listPermissions so identity matches
                const mapById = new Map<number, Permission>();
                (this.listPermissions || []).forEach((p) => mapById.set(p.id, p));
                this.targetPermissions = returned.map((r) => mapById.get(r.id) || r);

                const targetIds = new Set(this.targetPermissions.map((p) => p.id));
                this.sourcePermissions = (this.listPermissions || []).filter((p) => !targetIds.has(p.id));
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error.message });
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    loadAllPermissions() {
        this.permissionService.getAll().subscribe({
            next: (res) => {
                this.listPermissions = res.data?.rows || [];
                this.sourcePermissions = this.listPermissions.slice();

                // If we are currently editing a role, ensure target is synced using the freshly loaded list
                const editId = this.userRoleService.dataEditItem()?.id;
                if (editId) {
                    this.loadRolePermissions(editId);
                } else {
                    this.targetPermissions = [];
                }

                this.cdr.markForCheck();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error.message });
            }
        });
        // this.targetPermissions = [];
    }

    submit() {
        if (this.form.valid) {
            this.cdr.markForCheck();
            console.log(this.form.value);

            this.loading = true;
            if (this.userRoleService.isEditMode()) {
                this.update();
            } else {
                this.create();
            }
        } else {
            this.form.markAllAsTouched();
        }
    }

    create() {
        const payload = {
            ...this.form.value,
            permissionIds: Array.isArray(this.targetPermissions) ? this.targetPermissions.map((p) => p.id) : []
        };
        // Dispatch via facade; effects will handle API call and notifications
        this.facade.create(payload as any);
        this.waitingForResult = true;
    }

    update() {
        const id = this.userRoleService.dataEditItem()?.id;
        if (id == null) {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID không hợp lệ.' });
            return;
        }

        const payload = {
            ...this.form.value,
            permissionIds: Array.isArray(this.targetPermissions) ? this.targetPermissions.map((p) => p.id) : undefined
        };

        this.facade.update(id, payload as any);
        this.waitingForResult = true;
    }

    isInvalid(controlName: string) {
        const control = this.form.get(controlName);
        return control?.invalid && control.touched;
    }

    // Debug handlers for p-picklist events
    onMoveToTarget(event: { items: Permission[] }) {
        this.targetPermissions = [...this.targetPermissions];
        // console.log('Moved to target:', event.items);
        // console.log('Current sourcePermissions:', this.sourcePermissions);
        // console.log('Current targetPermissions:', this.targetPermissions);
    }

    onMoveToSource(event: { items: Permission[] }) {
        this.targetPermissions = [...this.targetPermissions];
        console.log('Moved to source:', event.items);
        console.log('Current sourcePermissions:', this.sourcePermissions);
        console.log('Current targetPermissions:', this.targetPermissions);
    }

    onMoveAllToTarget(event: { items: Permission[] }) {
        // console.log('Moved all to target:', event.items);
        // console.log('Current sourcePermissions:', this.sourcePermissions);
        // console.log('Current targetPermissions:', this.targetPermissions);
    }

    onMoveAllToSource(event: { items: Permission[] }) {
        // console.log('Moved all to source:', event.items);
        // console.log('Current sourcePermissions:', this.sourcePermissions);
        // console.log('Current targetPermissions:', this.targetPermissions);
    }
}

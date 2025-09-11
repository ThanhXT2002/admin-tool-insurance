import { Component, computed, effect, inject, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { FloatLabel, FloatLabelModule } from 'primeng/floatlabel';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@/core/auth/auth.store';
import { AuthApiService } from '@/core/auth/auth.api';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-avatar-profile',
    imports: [AvatarModule, DrawerModule, ButtonModule, FloatLabel, IconField, InputIcon, ReactiveFormsModule, IconFieldModule, InputTextModule, FormsModule, FloatLabelModule, CommonModule],
    template: `
        <button type="button" class="layout-topbar-action" (click)="handleShowProfile()">
            <img [src]="avatarUrl" class="!h-10 !w-10 object-cover rounded-full" size="large" alt="" (error)="handleImageError()" />
        </button>

        <p-drawer [(visible)]="isShowProfile" [blockScroll]="true" position="right">
            <ng-template #header>
                <div class="flex flex-col gap-2">
                    <img [src]="avatarUrl" class="!h-12 !w-12 object-cover rounded-full" size="large" alt="" (error)="handleImageError()" />
                    <div>
                        @if (authStore.profile()?.name) {
                            <p class="!mb-0">{{ authStore.profile()?.name }}</p>
                        }
                        <p class="">{{ authStore.profile()?.email }}</p>
                    </div>
                </div>
            </ng-template>
            <div class="h-full flex__middle">
                @if (uploading()) {
                    <i class="pi pi-spinner-dotted !text-3xl animate-spin"></i>
                }
            </div>
            <ng-template #footer>
                <div class="flex flex-col items-center gap-2">
                    @if (isBoxUpdateInfo) {
                        <div @slideUpDown class="w-full border border-gray-400/80 py-5 px-2 rounded-md relative">
                            <button (click)="handleShowBoxUpdateInfo()" class="absolute top-0 right-0 w-8 h-8 rounded-full hover:bg-gray-100 flex__middle">
                                <i class="pi pi-times"></i>
                            </button>
                            <div class="flex__middle mb-5">
                                <img [src]="displayAvatar" class="w-36 h-36 rounded-full overflow-hidden object-cover cursor-pointer" [alt]="authStore.profile()?.email" (click)="onAvatarClick()" (error)="handleImageError()" />
                            </div>
                            <form [formGroup]="updateForm">
                                <p-floatlabel variant="in" class="mb-5">
                                    <p-iconfield>
                                        <p-inputicon class="pi pi-user-edit" />
                                        <input pInputText id="name" formControlName="name" autocomplete="off" pSize="small" class="w-full" />
                                    </p-iconfield>
                                    <label for="name">Tên mới</label>
                                </p-floatlabel>

                                <p-floatlabel variant="in">
                                    <p-iconfield>
                                        <p-inputicon class="pi pi-building-columns" />
                                        <input pInputText id="addresses" formControlName="addresses" autocomplete="off" pSize="small" class="w-full" />
                                    </p-iconfield>
                                    <label for="addresses">Địa chỉ</label>
                                </p-floatlabel>
                            </form>
                        </div>
                    }

                    <button (click)="handleUpdateNow()" class="rounded-md w-full py-2 border border-primary text-primary hover:bg-primary hover:text-white">
                        <i class="pi pi-pen-to-square mr-3"></i>
                        @if (isBoxUpdateInfo) {
                            Cập nhật ngay
                        } @else {
                            Cập nhật thông tin
                        }
                    </button>
                    <button (click)="handleLogout()" class="rounded-md w-full py-2 border border-red-500 text-red-500 hover:bg-red-200/50">
                        <i class="pi pi-sign-out mr-3"></i>
                        Đăng xuất
                    </button>
                </div>
            </ng-template>
        </p-drawer>
    `,
    styles: `
        ::ng-deep .p-drawer-header {
            align-items: start !important;
        }
    `,
    animations: [
        trigger('slideUpDown', [
            transition(':enter', [style({ opacity: 0, transform: 'translateY(32px)' }), animate('350ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))]),
            transition(':leave', [animate('250ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'translateY(32px)' }))])
        ])
    ]
})
export class AppAvatarProfile {
    authStore = inject(AuthStore);
    authApiService = inject(AuthApiService);
    private messageService = inject(MessageService);

    // Preview / optimistic UI signals
    private previewAvatar = signal<string | null>(null);
    uploading = signal(false);

    get avatarUrl(): string | undefined {
        const profile = this.authStore.profile();
        return profile?.avatarUrl ?? 'assets/images/avatar-default.webp';
    }

    // Displayed avatar: preview when available, otherwise store avatar
    get displayAvatar(): string {
        return this.previewAvatar() ?? this.avatarUrl!;
    }

    private fb = inject(FormBuilder);

    isShowProfile: boolean = false;
    isBoxUpdateInfo: boolean = false;

    updateForm!: FormGroup;

    constructor() {
        this.updateForm = this.fb.group({
            name: ['', [Validators.required]],
            addresses: ['assets/images/avatar-default.webp']
        });

        effect(() => {
            const user = this.authStore.profile();
            if (user) {
                this.updateForm.patchValue({
                    name: user.name ?? '',
                    addresses: user.addresses
                });
                if (user.avatarUrl) {
                    this.hasImageError.set(false);
                }
            }
        });
    }

    onAvatarClick(): void {
        if (this.uploading()) return; // prevent concurrent uploads

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
            const file: File = event.target.files && event.target.files[0];
            if (!file) return;

            const oldAvatarUrl = this.avatarUrl;

            // create preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const previewUrl = e.target.result as string;
                this.previewAvatar.set(previewUrl);
                this.uploading.set(true);

                // call API to upload
                this.authApiService.updateAvatar(file).subscribe({
                    next: (res) => {
                        this.uploading.set(false);
                        if (res.status && res.data) {
                            // update store with server profile (authoritative)
                            this.authStore.setProfile(res.data);
                            // clear preview so displayAvatar reads from store
                            this.previewAvatar.set(null);
                            this.messageService.add({ severity: 'success', summary: 'Cập nhật avatar thành công' });
                        } else {
                            // revert preview
                            this.previewAvatar.set(null);
                            this.messageService.add({ severity: 'error', summary: 'Cập nhật avatar thất bại', detail: res?.message || 'Vui lòng thử lại' });
                        }
                    },
                    error: (err) => {
                        this.uploading.set(false);
                        this.previewAvatar.set(null);
                        this.messageService.add({ severity: 'error', summary: 'Cập nhật avatar thất bại', detail: err?.error?.message || 'Vui lòng thử lại' });
                    }
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    handleShowProfile(): void {
        this.isShowProfile = !this.isShowProfile;
    }

    handleShowBoxUpdateInfo(): void {
        this.isBoxUpdateInfo = !this.isBoxUpdateInfo;
    }

    handleUpdateNow() {
        if (this.isBoxUpdateInfo) {
            this.handleUpdateProfile();
        } else {
            this.handleShowBoxUpdateInfo();
        }
    }

    async handleUpdateProfile(): Promise<void> {
        if (!this.updateForm.valid) {
            this.updateForm.markAllAsTouched();
        }
        this.uploading.set(true);
        const data = this.updateForm.value;
        this.authApiService.updateProfile(data).subscribe({
            next: (res) => {
                if (res.status && res.data) {
                    this.authStore.setProfile(res.data);
                    this.messageService.add({ severity: 'success', summary: 'Cập nhật thành công' });
                    this.isBoxUpdateInfo = false; // Đóng box sau khi cập nhật
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Cập nhật thất bại', detail: err?.error?.message || 'Vui lòng thử lại' });
            },
            complete: () => {
              this.uploading.set(false);
            }
        });

    }

    async handleLogout(): Promise<void> {
        // await this.authService.logout();
        this.handleShowProfile();
    }

    private readonly hasImageError = signal(false);

    handleImageError(): void {
        this.hasImageError.set(true);
    }
}

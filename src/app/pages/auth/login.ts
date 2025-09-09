import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { Logo } from '@/layout/component/app.logo';
import { AuthService } from '../service/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, RouterModule, RippleModule, AppFloatingConfigurator, Logo, ReactiveFormsModule],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center w-full md:w-auto px-4">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)" class="w-full shadow-2xl">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="flex__middle flex-col mb-8">
                            <app-logo width="w-24" />
                            <span class="text-muted-color font-medium text-2xl mt-3">Login Admin Tool</span>
                        </div>

                        <form [formGroup]="loginForm" (ngSubmit)="submitLogin()">
                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email" type="text" placeholder="Email address" class="w-full md:w-120 mb-8" formControlName="email" [invalid]="isInvalid('email')" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                            <p-password id="password" formControlName="password" placeholder="Password" [toggleMask]="true" class="mb-4" [fluid]="true" [feedback]="false" [invalid]="isInvalid('password')"></p-password>
                            <p-button label="Sign In" styleClass="w-full" type="submit"></p-button>
                            <div class="text-center mt-2">
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService);
    private authStore = inject(AuthStore);
    private messageService = inject(MessageService);

    loginForm!: FormGroup;
    forgotForm!: FormGroup;
    isShowPassword = false;
    isTabLogin = true;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    get email() {
        return this.loginForm.get('email');
    }
    get password() {
        return this.loginForm.get('password');
    }

    submitLogin() {
        if (this.loginForm.valid) {
            const { email, password } = this.loginForm.value;
            this.authService.signIn(email, password).then(
                async (result: {
                    data: {
                        session?: {
                            access_token: string;
                            refresh_token: string;
                        } | null;
                        user?: unknown;
                    };
                    error?: { message: string } | null;
                }) => {
                    const { data, error } = result;
                    if (error) {
                        // Xử lý lỗi đăng nhập (ví dụ: hiển thị thông báo)

                        this.messageService.add({ severity: 'error', summary: error.message });

                        return;
                    }
                    if (data.session) {
                        this.messageService.add({ severity: 'success', summary: 'Đăng nhập thành công!' });
                        try {
                            const profile = await this.authStore.loadProfile();
                            if (profile) this.router.navigate(['/']);
                            else throw new Error('No profile');
                            this.router.navigate(['/']);
                        } catch (err: any) {
                            this.messageService.add({ severity: 'error', summary: 'Không load được profile' });
                        }
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Đăng nhập thất bại!' });
                    }
                }
            );
        } else {
            this.loginForm.markAllAsTouched();
        }
    }

    isInvalid(controlName: string) {
        const control = this.loginForm.get(controlName);
        return control?.invalid && control.touched;
    }

    // submitForgot() {
    //   if (this.forgotForm.valid) {
    //     const { email } = this.forgotForm.value;
    //     this.authService.resetPassword(email).then((result) => {
    //       // Xử lý kết quả, ví dụ: thông báo thành công
    //       this.ToastrService.success(this.translateService.instant('login.SEND_TO_EMAIL_SUCCESS'));
    //     }).catch((error) => {
    //       // Xử lý lỗi, ví dụ: thông báo lỗi
    //       this.ToastrService.error(this.translateService.instant('login.SEND_TO_EMAIL_FAILED'));
    //     });
    //   } else {
    //     this.forgotForm.markAllAsTouched();
    //   }
    // }

    handleShowPassword() {
        this.isShowPassword = !this.isShowPassword;
    }

    changeTab() {
        this.isTabLogin = !this.isTabLogin;
    }
}

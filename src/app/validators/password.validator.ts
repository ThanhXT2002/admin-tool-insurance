import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export class PasswordValidators {
  /**
   * Validator kiểm tra có ít nhất một ký tự viết hoa
   */
  static uppercase(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const hasUppercase = /[A-Z]/.test(value);
      return hasUppercase ? null : { uppercase: true };
    };
  }

  /**
   * Validator kiểm tra có ít nhất một ký tự viết thường
   */
  static lowercase(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const hasLowercase = /[a-z]/.test(value);
      return hasLowercase ? null : { lowercase: true };
    };
  }

  /**
   * Validator kiểm tra có ít nhất một chữ số
   */
  static number(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const hasNumber = /[0-9]/.test(value);
      return hasNumber ? null : { number: true };
    };
  }

  /**
   * Validator kiểm tra có ít nhất một ký tự đặc biệt
   */
  static specialCharacter(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        value
      );
      return hasSpecialChar ? null : { 'special-character': true };
    };
  }

  /**
   * Validator kiểm tra xem hai trường password và confirmPassword có khớp nhau không
   * @param passwordControlName Tên control của password (mặc định là 'password')
   * @param confirmPasswordControlName Tên control của confirm password (mặc định là 'confirmPassword')
   */
  static passwordMatch(
    passwordControlName: string = 'password',
    confirmPasswordControlName: string = 'confirmPassword'
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formGroup = control as FormGroup;
      const password = formGroup.get(passwordControlName)?.value;
      const confirmPassword = formGroup.get(confirmPasswordControlName)?.value;

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  /**
   * Validator tổng hợp cho password với tất cả các quy tắc
   * - Độ dài tối thiểu 8 ký tự
   * - Độ dài tối đa 16 ký tự
   * - Có ít nhất một chữ cái viết hoa
   * - Có ít nhất một chữ cái viết thường
   * - Có ít nhất một chữ số
   * - Có ít nhất một ký tự đặc biệt
   */
  static strongPassword(): ValidatorFn[] {
    return [
      // Sử dụng Validators.minLength và Validators.maxLength từ @angular/forms
      // nên cung cấp ở component khi sử dụng
      PasswordValidators.uppercase(),
      PasswordValidators.lowercase(),
      PasswordValidators.number(),
      PasswordValidators.specialCharacter(),
    ];
  }
}

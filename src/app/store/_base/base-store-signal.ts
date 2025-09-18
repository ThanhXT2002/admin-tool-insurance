import {
    computed,
    effect,
    signal,
    Signal,
    WritableSignal
} from '@angular/core';

/**
 * Lớp abstract cơ sở cho các Store sử dụng Angular Signals.
 * Mục đích:
 * - Giữ state nội bộ dưới dạng WritableSignal<S>
 * - Cung cấp các signal tiện ích: loading, error
 * - Cung cấp API cơ bản: snapshot, set, patch, select, createEffect, run, reset
 *
 * Các store con phải cài đặt `getInitialState()` để trả về trạng thái mặc định.
 */
export abstract class BaseStoreSignal<S> {
    // Signal nội bộ chứa toàn bộ state của store
    protected _state: WritableSignal<S>;
    // Signal tiện ích báo trạng thái đang tải
    public loading = signal(false);
    // Signal tiện ích lưu lỗi nếu có
    public error = signal<any>(null);

    constructor() {
        // Khởi tạo state bằng giá trị mặc định do subclass cung cấp
        this._state = signal(this.getInitialState());
    }

    // Subclass phải trả về state mặc định khi khởi tạo hoặc reset
    protected abstract getInitialState(): S;

    // Trả về snapshot hiện tại của state (dùng để đọc ngoài luồng reactive)
    snapshot(): S {
        return this._state();
    }

    // Gán nguyên trạng state mới (thay thế hoàn toàn)
    set(next: S) {
        this._state.set(next);
    }

    // Patch trạng thái theo kiểu shallow merge (dùng cho cập nhật một vài trường)
    patch(partial: Partial<S>) {
        this._state.update(
            (s) => ({ ...(s as any), ...(partial as any) }) as S
        );
    }

    // Reset state về giá trị mặc định và xóa loading/error
    reset() {
        this._state.set(this.getInitialState());
        this.loading.set(false);
        this.error.set(null);
    }

    // Tạo signal tính toán (selector) từ state
    select<T>(selector: (s: S) => T): Signal<T> {
        return computed(() => selector(this._state()));
    }

    // Tạo effect nhỏ (wrapper cho side-effect reactive)
    createEffect(fn: () => void) {
        return effect(() => fn());
    }

    // Wrapper cho các thao tác bất đồng bộ: tự set loading/error
    // Sử dụng: await this.run(() => apiCall())
    async run<T>(fn: () => Promise<T>): Promise<T> {
        try {
            this.loading.set(true);
            this.error.set(null);
            const res = await fn();
            this.loading.set(false);
            return res;
        } catch (err: any) {
            // Lưu lỗi để UI có thể hiển thị
            this.error.set(err);
            this.loading.set(false);
            throw err;
        }
    }
}

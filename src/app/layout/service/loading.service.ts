import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // Signal quản lý trạng thái loading toàn cục
  private loadingSignal = signal<boolean>(false);

  // Computed để truy cập trạng thái loading
  loading = computed(() => this.loadingSignal());

  // Hiển thị loading
  show(): void {
    this.loadingSignal.set(true);
  }

  // Ẩn loading
  hide(): void {
    this.loadingSignal.set(false);
  }

  // Toggle loading
  toggle(): void {
    this.loadingSignal.update((v) => !v);
  }

  // Truy cập trạng thái hiện tại
  isLoading(): boolean {
    return this.loadingSignal();
  }
}

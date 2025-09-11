export interface PaginatedState<T> {
    rows: T[];
    total: number;
    loading: boolean;
    error: any | null;
    // lastQueryParams có thể để chung hoặc move riêng nếu cần
    lastQueryParams?: { page?: number; limit?: number; keyword?: string | null; active?: boolean } | null;
}

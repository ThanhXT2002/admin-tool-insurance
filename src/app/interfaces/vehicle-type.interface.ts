export type UsageType = 'OTOKKDVT' | 'OTOKDVT' | 'XEMAY' | 'VCXOTO';
export type UsagePurpose = 'XCN' | 'XCH' | 'XCN_CH';

/**
 * Interface định nghĩa cấu trúc dữ liệu loại phương tiện
 * Sử dụng cho việc quản lý các loại phương tiện trong hệ thống bảo hiểm
 */
export interface VehicleType {
    id: number;
    vehicleTypeCode: string;
    vehicleTypeName: string;
    usageType: UsageType;
    usagePurpose: UsagePurpose;
    seatMin: number;
    seatMax: number;
    weightMin: number;
    weightMax: number;
    isShowSeat?: boolean;
    isShowWeight?: boolean;
    pricePerYear: number;
    active?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: number;
    updatedBy?: number;
}

/**
 * DTO cho việc tạo mới loại phương tiện
 * Chứa các trường bắt buộc và tùy chọn khi tạo mới
 */
export interface VehicleTypeCreateDto {
    vehicleTypeCode: string;
    vehicleTypeName: string;
    usageType: UsageType;
    usagePurpose: UsagePurpose;
    seatMin: number;
    seatMax: number;
    weightMin: number;
    weightMax: number;
    isShowSeat?: boolean;
    isShowWeight?: boolean;
    pricePerYear: number;
    active?: boolean;
}

/**
 * DTO cho việc cập nhật loại phương tiện
 * Kế thừa từ CreateDto nhưng tất cả field đều optional
 */
export interface VehicleTypeUpdateDto extends Partial<VehicleTypeCreateDto> {
    id?: number;
}

/**
 * Interface cho batch operations (toggle/delete multiple)
 */
export interface VehicleTypeBatchRequest {
    ids: number[];
    active?: boolean;
    hard?: boolean;
}

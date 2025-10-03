/**
 * Interface cho MenuCategory - Loại menu (header, footer, mobile, product...)
 */
export interface MenuCategory {
    id: number;
    key: string; // menu-header, menu-footer, menu-mobile, menu-product
    name: string; // "Menu Header", "Menu Footer"
    description?: string | null;
    active: boolean;
    position?: string | null; // header, footer, sidebar
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
    menus?: MenuItem[]; // Danh sách menu items (nếu được include)
}

/**
 * Interface cho MenuItem - Menu item với cấu trúc cây (nested tree)
 */
export interface MenuItem {
    id: number;
    key: string; // unique key cho mỗi node, ví dụ: "0", "0-0", "0-0-1"
    label: string; // Tên hiển thị của menu
    icon?: string | null; // Icon class (pi pi-home, pi pi-user...)
    url?: string | null; // URL đích
    routerLink?: string | null; // Angular router link
    command?: string | null; // JavaScript command (nếu cần)

    // Tree structure
    parentId?: number | null; // Self-reference cho parent
    categoryId: number; // Thuộc loại menu nào

    // Display & Behavior
    active: boolean;
    order: number; // Thứ tự hiển thị trong cùng cấp
    isBlank: boolean; // Mở link trong tab mới
    expanded: boolean; // Mặc định expand hay collapse

    // Audit fields
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;

    // Relations
    children?: MenuItem[]; // Children menu items
}

/**
 * DTO tạo MenuCategory mới
 */
export interface MenuCategoryCreateDto {
    key: string;
    name: string;
    description?: string;
    position?: string;
    active?: boolean;
}

/**
 * DTO cập nhật MenuCategory
 */
export interface MenuCategoryUpdateDto extends Partial<MenuCategoryCreateDto> {}

/**
 * DTO tạo MenuItem mới
 */
export interface MenuItemDto {
    categoryId: number;
    parentId?: number | null;
    key?: string; // Tự động generate nếu không có
    label: string;
    icon?: string;
    url?: string;
    routerLink?: string;
    command?: string;
    order?: number; // Tự động tính nếu không có
    isBlank?: boolean;
    expanded?: boolean;
    active?: boolean;
}

/**
 * DTO reorder menu items (sau drag-drop)
 */
export interface MenuItemReorderDto {
    id: number;
    order: number;
    parentId: number | null;
}

/**
 * DTO batch update order
 */
export interface MenuItemBatchOrderDto {
    id: number;
    order: number;
}

/**
 * MenuCategory kèm tree structure (PrimeNG format)
 */
export interface MenuCategoryTree {
    id: number;
    key: string;
    name: string;
    description?: string | null;
    active: boolean;
    position?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
    menus: MenuTreeNode[];
}

/**
 * TreeNode format cho PrimeNG Tree component
 */
export interface MenuTreeNode {
    key: string;
    label: string;
    data: {
        id: number;
        icon?: string;
        url?: string;
        routerLink?: string;
        command?: string;
        isBlank: boolean;
        active: boolean;
        order: number;
        [key: string]: any; // Custom data
    };
    icon?: string;
    expanded: boolean;
    children?: MenuTreeNode[];
}

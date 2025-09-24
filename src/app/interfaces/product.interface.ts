import { Seo } from './seo.interface';

export interface Product {
    id: number;
    sku?: string | null;
    name: string;
    slug?: string | null;
    description?: string | null;
    shortContent?: string | null;
    content?: string | null;
    price?: number | null;
    coverage?: string | null;
    term?: string | null;
    targetLink?: string | null;
    targetFile?: string | null;
    imgs?: string[] | null;
    details?: string | null;
    icon?: string | null;
    priority?: number | null;
    isHighlighted?: boolean | null;
    isFeatured?: boolean | null;
    isSaleOnline?: boolean | null;
    active?: boolean | null;
    tags?: string[] | null;
    isPromotion?: boolean | null;
    promotionDetails?: string | null;
    features?: any[] | null;
    metaKeywords?: string[] | null;
    note?: string | null;
    seoMeta?: Seo | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ProductCreateDto {
    name: string;
    description?: string;
    shortContent?: string;
    content?: string;
    price?: number;
    coverage?: string;
    term?: string;
    targetLink?: string;
    targetFile?: string;
    imgs?: File[] | string[] | null; // allow files or existing URLs
    sku?: string;
    details?: string;
    icon?: string;
    priority?: number;
    isHighlighted?: boolean;
    isFeatured?: boolean;
    isSaleOnline?: boolean;
    tags?: string[];
    isPromotion?: boolean;
    promotionDetails?: string;
    features?: any[];
    metaKeywords?: string[];
    note?: string;
    active?: boolean;
    seoMeta?: Seo | null;
}

export interface ProductUpdateDto extends Partial<ProductCreateDto> {
    id?: number;
}

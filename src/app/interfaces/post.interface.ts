import { Seo } from './seo.interface';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PostType = 'ARTICLE' | 'GUIDE' | 'NEWS' | 'PRODUCT' | 'FAQ';

export interface Post {
    id: number;
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    shortContent?: string | null;
    content: string;
    featuredImage?: string | null;
    albumImages?: string[] | null;
    status?: PostStatus;
    videoUrl?: string | null;
    note?: string | null;
    priority?: number;
    isHighlighted?: boolean;
    isFeatured?: boolean;
    scheduledAt?: string | null;
    expiredAt?: string | null;
    publishedAt?: string | null;
    targetAudience?: any[] | null;
    // Array of product objects returned by the API (kept for compatibility)
    relatedProducts?: any[] | null;
    metaKeywords?: string[] | null;
    postType?: PostType;
    // The API now returns the full category object (if present)
    category?: { id: number; name: string; slug: string } | null;
    // Tagged categories as objects (from join table)
    taggedCategories?: { id: number; name: string; slug: string }[] | null;
    seoMeta?: Seo | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface PostCreateDto {
    title: string;
    content: string;
    excerpt?: string;
    shortContent?: string;
    status?: PostStatus;
    postType?: PostType;
    categoryId?: number;
    taggedCategoryIds?: number[];
    scheduledAt?: string;
    expiredAt?: string;
    targetAudience?: any[];
    relatedProductIds?: number[];
    metaKeywords?: string[];
    note?: string;
    priority?: number;
    isHighlighted?: boolean;
    isFeatured?: boolean;
    featuredImage?: File | null;
    albumImages?: File[] | null;
    seoMeta?: Seo | null;
}

export interface PostUpdateDto extends Partial<PostCreateDto> {
    id?: number;
}

import { Seo } from "./seo.interface";

export interface PostCategory {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    parentId?: number | null;
    order?: number;
    active: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    children?: PostCategory[];
    parent?: PostCategory | null;
    posts?: { id: number; title: string; slug: string }[];
    seoMeta?: Seo;
}

export interface PostCategoryDto {
    name: string;
    description?: string;
    parentId?: number;
    order: number;
    active?: boolean;
    seoMeta?: Seo;
}

export interface PostCategoryNestedParams {
    page?: number;
    limit?: number;
    keyword?: string;
    active?: boolean;
    parentId?: number | null;
    includeInactive?: boolean | string;
}

import { Routes } from '@angular/router';
import { Posts } from './posts/posts/posts';
import { PostCategories } from './posts/post-categories/post-categories';
import { Users } from './users/users/users';
import { UserRoles } from './users/user-roles/user-roles';
import { Permissions } from './users/permissions/permissions';
import { PostCategoryForm } from './posts/post-category-form/post-category-form';
import { NestedPostCate } from './posts/nested-post-cate/nested-post-cate';
import { PostForm } from './posts/post-form/post-form';
import { Products } from './products/products/products';
import { ProductForm } from './products/product-form/product-form';
import { Contact } from './contact/contact';


export default [
    { path: 'post-categories', component:  PostCategories},
    { path: 'post-cate-nested', component:  NestedPostCate},
    { path: 'post-category/create', component:  PostCategoryForm},
    { path: 'post-category/update/:id', component:  PostCategoryForm},
    { path: 'posts', component: Posts },
    { path: 'post/create', component: PostForm },
    { path: 'posts/update/:id', component: PostForm },
    { path: 'users', component: Users },
    { path: 'user-roles', component: UserRoles },
    { path: 'permissions', component: Permissions },
    { path: 'products', component: Products },
    { path: 'product/create', component: ProductForm },
    { path: 'product/update/:id', component: ProductForm },
    { path: 'contact', component: Contact },
] as Routes;

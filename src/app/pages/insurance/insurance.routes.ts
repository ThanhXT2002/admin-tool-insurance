import { Routes } from '@angular/router';
import { Posts } from './posts/posts/posts';
import { PostCategories } from './posts/post-categories/post-categories';
import { Users } from './users/users/users';
import { UserRoles } from './users/user-roles/user-roles';
import { Permissions } from './users/permissions/permissions';
import { PostCategoryForm } from './posts/post-category-form/post-category-form';
import { NestedPostCate } from './posts/nested-post-cate/nested-post-cate';


export default [
    { path: 'post-categories', component:  PostCategories},
    { path: 'post-cate-nested', component:  NestedPostCate},
    { path: 'post-category/create', component:  PostCategoryForm},
    { path: 'post-category/update/:id', component:  PostCategoryForm},
    { path: 'posts', component: Posts },
    { path: 'users', component: Users },
    { path: 'user-roles', component: UserRoles },
    { path: 'permissions', component: Permissions },
] as Routes;

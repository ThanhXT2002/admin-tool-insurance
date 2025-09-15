import { Routes } from '@angular/router';
import { Posts } from './posts/posts/posts';
import { PostCategories } from './posts/post-categories/post-categories';
import { Users } from './users/users/users';
import { UserRoles } from './users/user-roles/user-roles';
import { Permissions } from './users/permissions/permissions';
import { PostCategoryForm } from './posts/post-category-form/post-category-form';


export default [
    { path: 'post-categories', component:  PostCategories},
    { path: 'post-category/create', component:  PostCategoryForm},
    { path: 'posts', component: Posts },
    { path: 'users', component: Users },
    { path: 'user-roles', component: UserRoles },
    { path: 'permissions', component: Permissions },
] as Routes;

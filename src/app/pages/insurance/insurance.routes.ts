import { Routes } from '@angular/router';
import { Posts } from './posts/posts/posts';
// import { Access } from './access';
// import { Login } from './login';
// import { Error } from './error';
import { Post } from '../../../../../api-insurance/generated/prisma/index';
import { PostCategories } from './posts/post-categories/post-categories';
import { Users } from './users/users/users';
import { UserRoles } from './users/user-roles/user-roles';
import { Permissions } from './users/permissions/permissions';


export default [
    { path: 'post/categories', component:  PostCategories},
    { path: 'posts', component: Posts },
    { path: 'users', component: Users },
    { path: 'user-roles', component: UserRoles },
    { path: 'permissions', component: Permissions },
] as Routes;

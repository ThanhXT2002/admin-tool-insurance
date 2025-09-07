import { Routes } from '@angular/router';
import { Posts } from './posts/posts/posts';
// import { Access } from './access';
// import { Login } from './login';
// import { Error } from './error';
import { Post } from '../../../../../api-insurance/generated/prisma/index';
import { PostCategories } from './posts/post-categories/post-categories';

export default [
    { path: 'post/categories', component:  PostCategories},
    // { path: 'error', component: Error },
    { path: 'posts', component: Posts }
] as Routes;

# Admin Tool Insurance - Admin Dashboard

[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20-blue.svg)](https://primeng.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.11-38B2AC.svg)](https://tailwindcss.com/)
[![NgRx](https://img.shields.io/badge/NgRx-20.0.1-purple.svg)](https://ngrx.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

**Admin Tool Insurance** là ứng dụng quản trị (Admin Dashboard) cho hệ thống bảo hiểm, được xây dựng với Angular 20. Admin tool cung cấp giao diện quản lý toàn diện cho nội dung, sản phẩm, người dùng, menu động, và các chức năng quản trị khác với hệ thống phân quyền chi tiết dựa trên RBAC (Role-Based Access Control).

---

## 📋 Mục Lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Modules](#-modules)
- [State Management](#-state-management)
- [Authentication & Guards](#-authentication--guards)
- [UI Components](#-ui-components)
- [Deploy](#-deploy)
- [Tác giả](#-tác-giả)

---

## 🚀 Tính năng chính

### ✅ **Authentication & Authorization**

- **JWT Authentication**: Đăng nhập với email/password, tích hợp Supabase Auth
- **Role-Based Access Control**: Phân quyền chi tiết với 5 roles (super_admin, admin, editor, author, user)
- **Permission System**: 31 permissions kiểm soát truy cập từng chức năng
- **Auth Guard**: Bảo vệ routes, kiểm tra permissions trước khi truy cập
- **Auto Logout**: Tự động đăng xuất khi token hết hạn
- **Profile Management**: Quản lý thông tin cá nhân, avatar, settings

### ✅ **Content Management (CMS)**

#### **Posts (Blog Management)**

- **CRUD Posts**: Tạo, sửa, xóa bài viết với rich text editor (CKEditor)
- **Post Categories**: Quản lý danh mục với cấu trúc tree (parent-child)
- **Nested Categories**: Hiển thị categories dạng tree với drag-drop reorder
- **SEO Management**: Quản lý meta tags, description, keywords cho mỗi post
- **Media Management**: Upload featured image, gallery images
- **Post Scheduling**: Lên lịch publish posts
- **Post Status**: Draft, Published, Archived
- **Highlighted & Featured**: Đánh dấu posts nổi bật
- **Category Tagging**: Gán nhiều categories cho một post

#### **Products Management**

- **CRUD Products**: Quản lý 17+ loại bảo hiểm
- **Product Info**: Name, slug, description, short description
- **Pricing**: Price, original price, currency
- **Media**: Featured image, gallery images (JSON)
- **Inventory**: Stock, SKU
- **Categories & Tags**: Phân loại sản phẩm, tags (JSON)
- **Featured Products**: Đánh dấu sản phẩm nổi bật, new arrival
- **SEO Integration**: Meta tags cho từng sản phẩm

### ✅ **Menu Management (Dynamic Menu System)**

- **Menu Categories**: Tạo categories (menu-header, menu-footer, menu-product)
- **Menu Items**: CRUD menu items với cấu trúc tree (parent-child)
- **Drag-Drop Reorder**: Kéo thả để sắp xếp menu items
- **Nested Menus**: Hỗ trợ menu nhiều cấp (unlimited depth)
- **Active/Inactive**: Bật/tắt menu items
- **Icons & URLs**: Thêm icon, url, routerLink cho menu items
- **Tree Component**: Hiển thị menu tree với PrimeNG Tree
- **Batch Operations**: Active/Inactive nhiều items cùng lúc

### ✅ **User Management**

- **CRUD Users**: Tạo, sửa, xóa users
- **Avatar Upload**: Upload ảnh đại diện với preview
- **User Info**: Name, email, phone, addresses
- **Active/Inactive**: Bật/tắt tài khoản
- **Role Assignment**: Gán roles cho users
- **Permission Assignment**: Gán permissions trực tiếp cho users (override roles)
- **User Profiles**: Xem profile chi tiết của users

### ✅ **Roles & Permissions Management**

- **CRUD Roles**: Quản lý 5 roles (super_admin, admin, editor, author, user)
- **Role Permissions**: Gán permissions cho roles
- **CRUD Permissions**: Quản lý 31 permissions
- **Permission Matrix**: Xem permissions theo roles
- **User Role Assignment**: Gán roles cho users với scope

### ✅ **Vehicle Types Management**

- **CRUD Vehicle Types**: Quản lý loại xe (motorcycle, car, truck, bus)
- **Category Key**: Phân loại theo category key
- **Order & Active**: Sắp xếp, bật/tắt
- **Integration**: Tích hợp với tính phí bảo hiểm xe

### ✅ **Contact Management**

- **View Contacts**: Danh sách liên hệ từ frontend
- **Contact Details**: Name, email, phone, subject, message
- **Status Management**: Pending, Processed, Closed
- **Priority Levels**: High, Medium, Low
- **Notes**: Thêm ghi chú cho contacts

### ✅ **Dashboard & Analytics**

- **Statistics Cards**: Tổng số users, posts, products, contacts
- **Charts**: Line, bar, pie charts với Chart.js
- **Recent Activities**: Hoạt động gần đây
- **Quick Actions**: Shortcuts đến các chức năng chính

### ✅ **UI/UX Components (PrimeNG)**

- **Data Tables**: Pagination, sorting, filtering, lazy loading
- **Forms**: Reactive forms với validation
- **Rich Text Editor**: CKEditor Classic & Inline
- **File Upload**: Multer với preview
- **Tree Component**: Nested tree với drag-drop
- **Dialogs**: Modals, confirmations
- **Toast Notifications**: Success, error, warning messages
- **Loading States**: Spinners, skeletons
- **Breadcrumbs**: Navigation breadcrumbs
- **Buttons**: Primary, secondary, danger, success buttons
- **Input Fields**: Text, number, select, checkbox, radio, date picker
- **Media Gallery**: Image gallery với lightbox
- **Charts**: Line, bar, pie, doughnut charts

### ✅ **State Management (NgRx Signals)**

- **Signal-Based Stores**: Lightweight state management
- **Base Store**: Reusable base store với CRUD operations
- **Auth Store**: Quản lý authentication state
- **Menu Store**: Quản lý menu categories & items
- **Post Store**: Quản lý posts state
- **Product Store**: Quản lý products state
- **User Store**: Quản lý users state
- **Notifications Store**: Quản lý notifications
- **Derived Signals**: Computed values từ state

---

## 🛠️ Công nghệ sử dụng

### **Frontend Framework**

- **Angular 20**: Framework chính với standalone components
- **TypeScript 5.8.3**: Type-safe development
- **RxJS 7.8.2**: Reactive programming

### **UI & Styling**

- **PrimeNG 20**: Component library (Table, Tree, Dialog, Toast, etc.)
- **PrimeUI Themes 1.2.1**: Custom theme system
- **TailwindCSS 4.1.11**: Utility-first CSS framework
- **TailwindCSS PrimeUI 0.6.1**: TailwindCSS integration cho PrimeNG
- **SCSS**: CSS preprocessor
- **FontAwesome 7.0.1**: Icon library
- **PrimeIcons 7.0.0**: PrimeNG icons
- **RemixIcon 4.6.0**: Modern icon set

### **Rich Text Editor**

- **CKEditor 5**:
    - `@ckeditor/ckeditor5-angular` 10.0.0
    - `@ckeditor/ckeditor5-build-classic` 41.4.2
    - `@ckeditor/ckeditor5-build-inline` 41.4.2
    - `@ckeditor/ckeditor5-editor-classic` 46.1.1
    - `@ckeditor/ckeditor5-editor-inline` 46.1.1
- **ngx-editor 19.0.0-beta.1**: Alternative editor

### **State Management**

- **NgRx Store 20.0.1**: State management (Redux pattern)
- **NgRx Effects 20.0.1**: Side effects management
- **NgRx Signals 20.0.1**: Signal-based stores
- **NgRx Store DevTools 20.0.1**: Redux DevTools integration

### **Charts & Visualization**

- **Chart.js 4.4.2**: Interactive charts (line, bar, pie, doughnut)

### **Authentication & Database**

- **Supabase 2.57.2**: Authentication & database client

### **Utilities**

- **Slugify 1.6.6**: URL-friendly slugs
- **PrimeCLT 0.1.5**: PrimeNG CLI tool

### **Development Tools**

- **Angular CLI 20**: Command-line tools
- **Angular DevKit**: Build tools
- **ESLint 9.30.1**: Linting
- **Prettier 3.6.2**: Code formatter
- **Karma & Jasmine**: Testing framework
- **Autoprefixer 10.4.20**: CSS vendor prefixes

---

## 📦 Yêu cầu hệ thống

- **Node.js**: >= 20.x (khuyến nghị 22.x)
- **npm**: >= 9.x hoặc **yarn** / **pnpm**
- **Angular CLI**: 20.x (sẽ được cài tự động)
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB cho build)
- **Disk Space**: ~800MB cho node_modules

---

## 📥 Cài đặt

### 1. Clone Repository

```bash
git clone https://github.com/ThanhXT2002/admin-tool-insurance.git
cd admin-tool-insurance
```

### 2. Cài đặt Dependencies

```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình Environment

Tạo file `src/environments/environment.ts`:

```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3600/api', // API Insurance URL
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your_supabase_anon_key',
    fileUploadUrl: 'https://file-fastify.tranxuanthanhtxt.com/api/files',
    imageUploadKey: 'your_upload_key'
};
```

Và `src/environments/environment.prod.ts`:

```typescript
export const environment = {
    production: true,
    apiUrl: 'https://api-insurance.tranxuanthanhtxt.com/api',
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your_supabase_anon_key',
    fileUploadUrl: 'https://file-fastify.tranxuanthanhtxt.com/api/files',
    imageUploadKey: 'your_upload_key'
};
```

**Lưu ý**: File `environment.ts` không được commit lên Git. Sử dụng `generate-env.js` để tạo env cho Vercel.

---

## 🎯 Chạy ứng dụng

### **Development Mode**

Chạy server phát triển trên port **4666**:

```bash
npm run dev
# hoặc
npm start
```

Truy cập: `http://localhost:4666`

Ứng dụng sẽ tự động reload khi bạn thay đổi source code.

---

### **Production Mode**

#### 1. Build

```bash
npm run build
```

Output: `dist/admin-tool-insurance/`

#### 2. Serve Production Build

```bash
npx http-server dist/admin-tool-insurance/browser -p 8080
```

---

### **Build cho Vercel**

```bash
npm run build:vercel
```

Sử dụng `generate-env.js` để tạo environment variables và build.

---

## 📂 Cấu trúc dự án

```
admin-tool-insurance/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Root component
│   │   ├── app.config.ts          # App configuration
│   │   ├── app.routes.ts          # Main routing
│   │   ├── guards/
│   │   │   └── auth.guard.ts      # Auth guard (check JWT + permissions)
│   │   ├── interceptors/
│   │   │   └── http.interceptor.ts # HTTP interceptor (add JWT token)
│   │   ├── interfaces/            # TypeScript interfaces
│   │   │   ├── api-response.interface.ts
│   │   │   ├── menu.interface.ts
│   │   │   ├── post.interface.ts
│   │   │   ├── product.interface.ts
│   │   │   ├── user.interface.ts
│   │   │   ├── permission.interface.ts
│   │   │   └── ...
│   │   ├── layout/                # Layout components
│   │   │   ├── app.layout.ts      # Main layout (sidebar + topbar)
│   │   │   ├── app.sidebar.ts     # Sidebar navigation
│   │   │   ├── app.topbar.ts      # Topbar (profile, notifications)
│   │   │   └── app.menu.ts        # Menu configuration
│   │   ├── pages/                 # Feature pages
│   │   │   ├── dashboard/         # Dashboard page
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── insurance/         # Insurance management
│   │   │   │   ├── posts/         # Post management
│   │   │   │   │   ├── posts/     # List posts
│   │   │   │   │   ├── post-form/ # Create/Edit post
│   │   │   │   │   ├── post-categories/ # List categories
│   │   │   │   │   ├── post-category-form/ # Create/Edit category
│   │   │   │   │   └── nested-post-cate/  # Tree view categories
│   │   │   │   ├── products/      # Product management
│   │   │   │   │   ├── products/  # List products
│   │   │   │   │   └── product-form/ # Create/Edit product
│   │   │   │   ├── users/         # User management
│   │   │   │   │   ├── users/     # List users
│   │   │   │   │   ├── user-roles/ # Manage roles
│   │   │   │   │   └── permissions/ # Manage permissions
│   │   │   │   ├── contact/       # Contact management
│   │   │   │   └── vehicle-type/  # Vehicle types
│   │   │   ├── menu/              # Menu management
│   │   │   │   ├── menu-list/     # List menu categories
│   │   │   │   ├── menu-item/     # Menu item tree (drag-drop)
│   │   │   │   ├── menu-form/     # Create/Edit category
│   │   │   │   └── menu-item-form/ # Create/Edit item
│   │   │   ├── crud/              # Generic CRUD example
│   │   │   ├── uikit/             # UI component examples
│   │   │   ├── documentation/     # Docs page
│   │   │   ├── empty/             # Empty page template
│   │   │   ├── landing/           # Landing page
│   │   │   └── notfound/          # 404 page
│   │   ├── store/                 # NgRx Signals stores
│   │   │   ├── _base/             # Base store abstract class
│   │   │   ├── auth/              # Auth store
│   │   │   ├── menu/              # Menu stores
│   │   │   │   ├── menuCate.store.ts
│   │   │   │   └── menu.store.ts
│   │   │   ├── post/              # Post stores
│   │   │   ├── product/           # Product store
│   │   │   ├── user/              # User stores
│   │   │   ├── permissions/       # Permissions store
│   │   │   └── notifications/     # Notifications store
│   │   ├── utils/                 # Utility functions
│   │   └── validators/            # Form validators
│   ├── assets/                    # Static assets
│   │   ├── images/
│   │   ├── layout/                # Layout styles (PrimeNG Sakai theme)
│   │   └── styles.scss            # Global styles
│   ├── environments/              # Environment configs
│   │   ├── environment.ts         # Development env
│   │   └── environment.prod.ts    # Production env
│   └── index.html                 # HTML entry point
├── documents/                     # Technical documentation
│   ├── MENU_MODULE_README.md     # Menu module guide
│   ├── workFlow-auth.md          # Auth workflow guide
│   └── luồng-hoạt-động-cửa-dữ-liệu-khi-áp-dụng-ngRx.md
├── angular.json                   # Angular CLI config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── eslint.config.js               # ESLint config
├── .prettierrc.json               # Prettier config
├── vercel.json                    # Vercel deployment config
├── generate-env.js                # Generate env for Vercel
└── README.md                      # This file
```

---

## 🧩 Modules

Admin Tool được tổ chức thành **12 module chính**:

### **1. Dashboard Module**

- **Dashboard**: Tổng quan hệ thống với statistics, charts, recent activities

### **2. Authentication Module** (`/auth`)

| Route            | Component | Mô tả            |
| ---------------- | --------- | ---------------- |
| `/auth/login`    | Login     | Đăng nhập        |
| `/auth/register` | Register  | Đăng ký (nếu có) |

### **3. Insurance Management Module** (`/insurance`)

#### **Posts (Blog)**

| Route                         | Component | Mô tả              |
| ----------------------------- | --------- | ------------------ |
| `/insurance/posts`            | Posts     | Danh sách bài viết |
| `/insurance/post/create`      | PostForm  | Tạo bài viết mới   |
| `/insurance/posts/update/:id` | PostForm  | Sửa bài viết       |

#### **Post Categories**

| Route                                 | Component        | Mô tả                        |
| ------------------------------------- | ---------------- | ---------------------------- |
| `/insurance/post-categories`          | PostCategories   | Danh sách categories (table) |
| `/insurance/post-cate-nested`         | NestedPostCate   | Categories tree (drag-drop)  |
| `/insurance/post-category/create`     | PostCategoryForm | Tạo category                 |
| `/insurance/post-category/update/:id` | PostCategoryForm | Sửa category                 |

#### **Products**

| Route                           | Component   | Mô tả              |
| ------------------------------- | ----------- | ------------------ |
| `/insurance/products`           | Products    | Danh sách sản phẩm |
| `/insurance/product/create`     | ProductForm | Tạo sản phẩm       |
| `/insurance/product/update/:id` | ProductForm | Sửa sản phẩm       |

#### **Users**

| Route                    | Component   | Mô tả               |
| ------------------------ | ----------- | ------------------- |
| `/insurance/users`       | Users       | Danh sách users     |
| `/insurance/user-roles`  | UserRoles   | Quản lý roles       |
| `/insurance/permissions` | Permissions | Quản lý permissions |

#### **Contact**

| Route                | Component | Mô tả             |
| -------------------- | --------- | ----------------- |
| `/insurance/contact` | Contact   | Danh sách liên hệ |

#### **Vehicle Types**

| Route                     | Component   | Mô tả           |
| ------------------------- | ----------- | --------------- |
| `/insurance/vehicle-type` | VehicleType | Quản lý loại xe |

### **4. Menu Management Module** (`/menu`)

| Route            | Component | Mô tả                                    |
| ---------------- | --------- | ---------------------------------------- |
| `/menu/list`     | MenuList  | Danh sách menu categories                |
| `/menu/item/:id` | MenuItem  | Tree view menu items (drag-drop reorder) |

### **5. CRUD Module** (`/pages`)

| Route                  | Component     | Mô tả                |
| ---------------------- | ------------- | -------------------- |
| `/pages/crud`          | Crud          | Generic CRUD example |
| `/pages/empty`         | Empty         | Empty page template  |
| `/pages/documentation` | Documentation | Documentation page   |

### **6. UI Kit Module** (`/uikit`)

15 component examples:

- Button, Charts, File Upload, Form Layout, Input
- List, Media, Message, Misc, Panel
- Timeline, Table, Overlay, Tree, Menu

---

## 🔄 State Management

### **NgRx Signals Architecture**

Admin Tool sử dụng **NgRx Signals** (lightweight alternative to NgRx Store) với kiến trúc:

#### **Base Store Pattern**

```typescript
// src/app/store/_base/base-store-signal.ts
abstract class BaseStoreSignal<T> {
    // Core state
    protected state = signal<T>(initialState);

    // Derived signals
    loading = computed(() => this.state().loading);
    error = computed(() => this.state().error);

    // CRUD methods
    abstract loadAll(query?): Promise<void>;
    abstract loadOne(id): Promise<void>;
    abstract create(data): Promise<void>;
    abstract update(id, data): Promise<void>;
    abstract delete(id): Promise<void>;
}
```

#### **Stores đã triển khai:**

1. **AuthStore** (`store/auth/`)
    - `profile()`: User profile signal
    - `isAuthenticated()`: Auth status
    - `permissions()`: User permissions
    - `hasPermission(key)`: Check permission
    - Methods: `login()`, `logout()`, `loadProfile()`

2. **MenuCateStore** (`store/menu/menuCate.store.ts`)
    - `categories()`: Menu categories list
    - `selectedCategory()`: Selected category
    - `selectedCategoryTree()`: Category with tree structure
    - Methods: `loadAll()`, `loadTree()`, `create()`, `update()`, `delete()`

3. **MenuStore** (`store/menu/menu.store.ts`)
    - `items()`: Menu items
    - `tree()`: Menu tree structure (PrimeNG format)
    - Methods: `loadByCategory()`, `reorder()`, `create()`, `update()`, `delete()`

4. **PostStore** (`store/post/`)
    - `posts()`: Posts list
    - `selectedPost()`: Selected post
    - Methods: CRUD operations, publish, unpublish

5. **PostCategoryStore** (`store/postCategory/`)
    - `categories()`: Post categories
    - `tree()`: Category tree
    - Methods: CRUD, reorder

6. **ProductStore** (`store/product/`)
    - `products()`: Products list
    - Methods: CRUD operations

7. **UserStore** (`store/user/`)
    - `users()`: Users list
    - Methods: CRUD, assign roles

8. **PermissionStore** (`store/permissions/`)
    - `permissions()`: All permissions
    - `roles()`: All roles

9. **NotificationStore** (`store/notifications/`)
    - `notifications()`: Notifications list
    - Methods: `add()`, `remove()`, `markAsRead()`

---

## 🔐 Authentication & Guards

### **Auth Guard**

Bảo vệ routes dựa trên JWT token và permissions:

```typescript
// src/app/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    // Check if user is authenticated
    if (!authStore.isAuthenticated()) {
        router.navigate(['/auth/login']);
        return false;
    }

    // Check permissions (if route requires specific permission)
    const requiredPermission = route.data['permission'];
    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
        router.navigate(['/access-denied']);
        return false;
    }

    return true;
};
```

### **HTTP Interceptor**

Tự động thêm JWT token vào mọi request:

```typescript
// src/app/interceptors/http.interceptor.ts
export const httpInterceptor: HttpInterceptorFn = (req, next) => {
    const authStore = inject(AuthStore);
    const token = authStore.token();

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                authStore.logout();
                inject(Router).navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
```

---

## 🎨 UI Components

### **PrimeNG Components sử dụng:**

#### **Data Display**

- **Table**: Pagination, sorting, filtering, lazy loading, row selection
- **Tree**: Nested tree với drag-drop reorder
- **Card**: Info cards, statistics cards
- **Timeline**: Activity timeline
- **DataView**: Alternative data display

#### **Forms & Input**

- **InputText**, **InputNumber**, **InputTextarea**
- **Dropdown**, **MultiSelect**, **AutoComplete**
- **Calendar** (DatePicker)
- **Checkbox**, **RadioButton**, **ToggleButton**
- **FileUpload**: với preview
- **Editor**: Rich text editor (CKEditor)

#### **Buttons & Actions**

- **Button**: Primary, secondary, success, danger, warning
- **SplitButton**: Button with dropdown
- **ToggleButton**: On/off switch
- **SpeedDial**: Floating action button

#### **Overlays**

- **Dialog**: Modal dialogs
- **ConfirmDialog**: Confirmation dialogs
- **Sidebar**: Slide-in panels
- **OverlayPanel**: Popover panels
- **Tooltip**: Hover tooltips

#### **Messages**

- **Toast**: Success, error, warning notifications
- **Message**: Inline messages
- **Messages**: Multiple inline messages

#### **Charts (Chart.js)**

- **LineChart**: Line charts
- **BarChart**: Bar charts
- **PieChart**: Pie & Doughnut charts
- **RadarChart**: Radar charts

#### **Menu & Navigation**

- **Menu**: Context menus
- **Breadcrumb**: Navigation breadcrumbs
- **Steps**: Step indicators
- **TabView**: Tabbed navigation

#### **Misc**

- **ProgressBar**: Progress indicators
- **ProgressSpinner**: Loading spinners
- **Skeleton**: Loading placeholders
- **Avatar**: User avatars
- **Badge**: Notification badges
- **Tag**: Labels & tags

---

## 🚀 Deploy

### **Deploy lên Vercel**

#### 1. **Cấu hình Vercel**

File `vercel.json` đã có sẵn:

```json
{
    "version": 2,
    "builds": [{ "src": "package.json", "use": "@vercel/static-build" }],
    "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
```

#### 2. **Deploy Steps**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 3. **Environment Variables trên Vercel**

Thêm các biến trong Vercel Dashboard → Settings → Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `API_URL`
- `FILE_UPLOAD_URL`
- `IMAGE_UPLOAD_KEY`

#### 4. **Build Command**

Vercel tự động chạy:

```bash
npm run build:vercel
```

---

### **Deploy lên VPS/Server**

#### 1. **Build**

```bash
npm run build
```

#### 2. **Nginx Configuration**

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/admin-tool-insurance/dist/admin-tool-insurance/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. **SSL với Certbot**

```bash
sudo certbot --nginx -d admin.yourdomain.com
```

---

## 📜 Scripts Quan Trọng

| Script                 | Mô tả                    |
| ---------------------- | ------------------------ |
| `npm run dev`          | Dev server (port 4666)   |
| `npm start`            | Alias của `npm run dev`  |
| `npm run build`        | Build production         |
| `npm run build:vercel` | Build cho Vercel         |
| `npm run watch`        | Build với watch mode     |
| `npm run format`       | Format code với Prettier |
| `npm test`             | Chạy unit tests          |

---

## 📚 Tài liệu Bổ sung

Xem thư mục `documents/` cho các hướng dẫn chi tiết:

| File                                              | Nội dung                                  |
| ------------------------------------------------- | ----------------------------------------- |
| `MENU_MODULE_README.md`                           | Hướng dẫn chi tiết Menu Management Module |
| `workFlow-auth.md`                                | Workflow authentication với NgRx Signals  |
| `luồng-hoạt-động-cửa-dữ-liệu-khi-áp-dụng-ngRx.md` | Data flow khi dùng NgRx                   |

---

## 🐛 Troubleshooting

### **Port Already in Use**

```bash
# Đổi port trong package.json
"dev": "ng serve --port=4667 --host=0.0.0.0"
```

### **Build Failed**

```bash
# Clear cache và rebuild
rm -rf .angular node_modules package-lock.json
npm install
npm run build
```

### **API Connection Error**

- Kiểm tra `environment.ts` có `apiUrl` đúng
- Verify API backend đang chạy
- Check CORS settings trên API

### **Auth Token Invalid**

- Kiểm tra JWT_SECRET giống API backend
- Verify token expiration (default 15 phút)
- Clear localStorage và login lại

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo branch feature: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Mở Pull Request

### **Coding Standards**

- Sử dụng Prettier: `npm run format`
- Tuân thủ Angular Style Guide
- Viết components standalone (Angular 20)
- Sử dụng Signals cho state management

---

## 🌐 Demo

**Live Demo**: [https://admin-tool-xtbh.tranxuanthanhtxt.com](https://admin-tool-xtbh.tranxuanthanhtxt.com)

---

## 📝 License

Dự án này sử dụng license **MIT**. Xem file [LICENSE.md](LICENSE.md) để biết thêm chi tiết.

---

## 👨‍💻 Tác giả

**Trần Xuân Thành**

- 📧 Email: [tranxuanthanhtxt2002@gmail.com](mailto:tranxuanthanhtxt2002@gmail.com)
- 🐙 GitHub: [@ThanhXT2002](https://github.com/ThanhXT2002)
- 🌐 Admin Demo: [https://admin-tool-xtbh.tranxuanthanhtxt.com](https://admin-tool-xtbh.tranxuanthanhtxt.com)

---

## 🙏 Acknowledgments

- [Angular Team](https://angular.dev/) - Framework tuyệt vời
- [PrimeNG](https://primeng.org/) - UI Component Library
- [PrimeTek](https://primetek.com.tr/) - Sakai Admin Theme
- [TailwindCSS](https://tailwindcss.com/) - Utility CSS
- [Chart.js](https://www.chartjs.org/) - Charts library
- [CKEditor](https://ckeditor.com/) - Rich text editor
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📞 Liên hệ & Hỗ trợ

Nếu có bất kỳ câu hỏi hoặc vấn đề, vui lòng:

- 📧 Email: tranxuanthanhtxt2002@gmail.com
- 🐛 Open Issue: [GitHub Issues](https://github.com/ThanhXT2002/admin-tool-insurance/issues)
- 🌐 Demo: [https://admin-tool-xtbh.tranxuanthanhtxt.com](https://admin-tool-xtbh.tranxuanthanhtxt.com)

---

**🎉 Cảm ơn bạn đã sử dụng Admin Tool Insurance!**

_Built with ❤️ using Angular 20, PrimeNG, and NgRx Signals_

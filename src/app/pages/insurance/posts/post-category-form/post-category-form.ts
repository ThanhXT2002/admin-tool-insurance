import { Component, EventEmitter, input, Input, Output, WritableSignal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

@Component({
    selector: 'app-post-category-form',
    imports: [DrawerModule],
    templateUrl: './post-category-form.html',
    styleUrl: './post-category-form.scss'
})
export class PostCategoryForm {
    @Input() headerTitle: string = 'New Post Category';
    // nhận WritableSignal từ parent (có .set)
    @Input() isShow!: WritableSignal<boolean>;

    onVisibleChange(v: boolean) {
        this.isShow.set(v);
    }
}

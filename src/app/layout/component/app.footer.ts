import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer py-2!">
        Admin tool
        <a href="https://xtbh.tranxuanthanhtxt.com" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">XTBH</a>
    </div>`
})
export class AppFooter {}

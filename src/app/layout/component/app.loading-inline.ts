import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-loading-inline',
    imports: [NgClass],
    template: `
       @if(isLoading){
            <i class="ri-loader-2-fill text-primary animate-spin inline-block"
            [ngClass]="customClass"
            ></i>
       }
    `
})
export class AppLoadingInline {
    @Input() isLoading = false;
    @Input() customClass = 'text-base'
}

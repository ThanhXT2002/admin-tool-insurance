import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-logo',
    imports: [],
    template: `
        <div class="flex items-center cursor-pointer">
            <img ngOptimizedImage [src]="imgSrc" alt="Logo" [class]="'mr-2 aspect-square ' + width" />
            @if (isShowName) {
                <span class="font-ptserif text-2xl md:text-3xl font-bold text-green-700">XTBH</span>
            }
        </div>
    `
})
export class Logo {
    @Input() imgSrc: string = 'https://xtbh.tranxuanthanhtxt.com/assets/images/logo-insurance.webp';
    @Input() isShowName: boolean = false;
    @Input() width: string = 'w-9 md:w-10'; // Tailwind width classes
}

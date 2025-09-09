import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-loading',
    imports: [],
    template: `
        <div class="h-screen w-full flex justify-center items-center bg-white dark:bg-gray-900">
            <div class="relative flex items-center justify-center w-54 h-54">
                <span class="absolute w-48 h-48 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></span>
                <img src="https://xtbh.tranxuanthanhtxt.com/assets/images/logo-insurance.webp" class="w-32 h-32 relative z-10" alt="" />
            </div>
        </div>
    `
})
export class AppLoading {
    constructor() {
        console.log('AppLoading component created!');
    }
}

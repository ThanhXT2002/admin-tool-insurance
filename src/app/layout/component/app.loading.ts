import { Component } from '@angular/core';
import { Logo } from './app.logo';

@Component({
    standalone: true,
    selector: 'app-loading',
    imports: [Logo],
    template: `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.95); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="margin-bottom: 2rem;">
                <app-logo width="w-24 md:w-32" />
            </div>
        </div>
    `,
    styles: [
        `
            @keyframes bounce {
                0%,
                80%,
                100% {
                    transform: scale(0);
                }
                40% {
                    transform: scale(1);
                }
            }
        `
    ]
})
export class AppLoading {
    constructor() {
        console.log('AppLoading component created!');
    }
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, appConfig).then(() => {
     const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
  }).catch((err) => console.error(err));

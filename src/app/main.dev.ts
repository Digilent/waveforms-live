import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import { HomeModule } from '../pages/home/home.module';

platformBrowserDynamic().bootstrapModule(AppModule);

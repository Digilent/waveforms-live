import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { HomePage } from './home';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(HomePage)
    ],
    declarations: [
        HomePage
    ],
    exports: [
        HomePage
    ]
})
export class HomeModule { }
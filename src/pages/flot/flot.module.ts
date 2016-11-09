import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { FlotPage } from './flot';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(FlotPage)
    ],
    declarations: [
        FlotPage
    ],
    exports: [FlotPage]
})
export class FlotModule { }
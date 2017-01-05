import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { CalibratePage } from './calibrate';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(CalibratePage)
    ],
    declarations: [
        CalibratePage
    ],
    exports: [CalibratePage]
})
export class CalibrateModule { }
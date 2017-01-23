import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { LoadFirmwarePage } from './load-firmware';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(LoadFirmwarePage)
    ],
    declarations: [
        LoadFirmwarePage
    ],
    exports: [LoadFirmwarePage]
})
export class LoadFirmwareModule { }
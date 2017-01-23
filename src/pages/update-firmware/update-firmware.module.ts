import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { UpdateFirmwarePage } from './update-firmware';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(UpdateFirmwarePage)
    ],
    declarations: [
        UpdateFirmwarePage
    ],
    exports: [UpdateFirmwarePage]
})
export class UpdateFirmwareModule { }
import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { DeviceManagerPage } from './device-manager-page';
import { DeviceConfigureModal } from '../device-configure-modal/device-configure-modal';
import { BridgeModalPage } from '../bridge-modal/bridge-modal';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(DeviceConfigureModal),
        IonicModule.forRoot(BridgeModalPage)
    ],
    declarations: [
        DeviceManagerPage,
        BridgeModalPage,
        DeviceConfigureModal
    ],
    exports: [
        DeviceManagerPage
    ]
})
export class DeviceManagerPageModule { }
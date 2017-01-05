import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { DeviceManagerPage } from './device-manager-page';
import { DeviceConfigureModal } from '../device-configure-modal/device-configure-modal';
import { BridgeModalPage } from '../bridge-modal/bridge-modal';

//Modules
import { CalibrateModule } from '../calibrate/calibrate.module';
import { WifiSetupModule } from '../wifi-setup/wifi-setup.module';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(DeviceConfigureModal),
        IonicModule.forRoot(BridgeModalPage),
        CalibrateModule,
        WifiSetupModule
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
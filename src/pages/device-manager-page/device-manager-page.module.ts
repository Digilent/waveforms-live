import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { DeviceManagerPage } from './device-manager-page';
import { DeviceConfigureModal } from '../device-configure-modal/device-configure-modal';

//Modules
import { CalibrateModule } from '../calibrate/calibrate.module';
import { WifiSetupModule } from '../wifi-setup/wifi-setup.module';
import { LoadFirmwareModule } from '../load-firmware/load-firmware.module';
import { UpdateFirmwareModule } from '../update-firmware/update-firmware.module';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(DeviceConfigureModal),
        CalibrateModule,
        WifiSetupModule,
        LoadFirmwareModule,
        UpdateFirmwareModule
    ],
    declarations: [
        DeviceManagerPage,
        DeviceConfigureModal
    ],
    exports: [
        DeviceManagerPage
    ]
})
export class DeviceManagerPageModule { }
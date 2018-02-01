import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

//Pages
import { DeviceManagerPage } from './device-manager-page';
import { DeviceConfigurePage } from '../device-configure/device-configure';

//Modules
import { CalibrateModule } from '../calibrate/calibrate.module';
import { WifiSetupModule } from '../wifi-setup/wifi-setup.module';
import { LoadFirmwareModule } from '../load-firmware/load-firmware.module';
import { UpdateFirmwareModule } from '../update-firmware/update-firmware.module';

import { GithubForkRibbon } from '../../components/github-fork-ribbon/github-fork-ribbon';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(DeviceConfigurePage),
        CalibrateModule,
        WifiSetupModule,
        LoadFirmwareModule,
        UpdateFirmwareModule
    ],
    declarations: [
        GithubForkRibbon,
        DeviceManagerPage,
        DeviceConfigurePage
    ],
    exports: [
        DeviceManagerPage
    ]
})
export class DeviceManagerPageModule { }
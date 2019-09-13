import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

//Pages
import { DeviceManagerPage } from './device-manager-page';
import { DeviceConfigurePage } from '../device-configure/device-configure';

//Modules
import { CalibrateModule } from '../calibrate/calibrate.module';
import { WifiSetupModule as OpenScopeWiFiModule } from '../wifi-setup/openscope/wifi-setup.module';
import { WifiSetupModule as OpenLoggerWiFiModule } from '../wifi-setup/openlogger/wifi-setup.module';
import { LoadFirmwareModule } from '../load-firmware/load-firmware.module';
import { UpdateFirmwareModule } from '../update-firmware/update-firmware.module';
import { OpenLoggerLoggerModule } from '../logger/openlogger/openlogger-logger.module';

import { GithubForkRibbon } from '../../components/github-fork-ribbon/github-fork-ribbon';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(DeviceConfigurePage),
        CalibrateModule,
        OpenScopeWiFiModule,
        OpenLoggerWiFiModule,
        LoadFirmwareModule,
        UpdateFirmwareModule,
        OpenLoggerLoggerModule
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
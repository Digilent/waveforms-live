import { NgModule, Optional, SkipSelf } from '@angular/core';

import { StorageService } from '../../services/storage/storage.service';
import { Storage } from '@ionic/storage';
import { DeviceManagerService } from '../../services/device/device-manager.service';
import { SettingsService } from '../../services/settings/settings.service';

@NgModule({
    imports: [],
    providers: [
        Storage,
        StorageService,
        DeviceManagerService,
        SettingsService
    ]
})
export class CoreModule {

    constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error(
                'CoreModule is already loaded. Import it in the AppModule only');
        }
    }
}
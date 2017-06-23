import { NgModule, Optional, SkipSelf } from '@angular/core';

import { StorageService } from '../../services/storage/storage.service';
import { Storage } from '@ionic/storage';
import { DeviceDataTransferService } from '../../services/device/device-data-transfer.service';
import { DeviceManagerService } from 'dip-angular2/services';
import { SettingsService } from '../../services/settings/settings.service';
import { ToastService } from '../../services/toast/toast.service';
import { LoadingService } from '../../services/loading/loading.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';
import { UtilityService } from '../../services/utility/utility.service';
import { ExportService } from '../../services/export/export.service';

@NgModule({
    imports: [],
    providers: [
        Storage,
        StorageService,
        DeviceManagerService,
        SettingsService,
        ToastService,
        TooltipService,
        UtilityService,
        LoadingService,
        ExportService,
        DeviceDataTransferService
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
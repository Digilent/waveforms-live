import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { DeviceManagerPage } from './device-manager-page';
import { Tab1 } from './device-manager-tabs/device-manager-tab1/device-manager-tab1';
import { Tab2 } from './device-manager-tabs/device-manager-tab2/device-manager-tab2';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DeviceManagerPage),
        IonicModule.forRoot(Tab1),
        IonicModule.forRoot(Tab2)
    ],
    declarations: [
        DeviceManagerPage,
        Tab1,
        Tab2
    ],
    exports: [
        DeviceManagerPage
    ]
})
export class DeviceManagerPageModule { }
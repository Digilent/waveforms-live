import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { WifiSetupPage } from './wifi-setup';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(WifiSetupPage)
    ],
    declarations: [
        WifiSetupPage
    ],
    exports: [WifiSetupPage]
})
export class WifiSetupModule { }
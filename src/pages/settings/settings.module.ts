import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { SettingsPage } from './settings';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(SettingsPage)
    ],
    declarations: [
        SettingsPage
    ],
    exports: [SettingsPage]
})
export class SettingsModule { }
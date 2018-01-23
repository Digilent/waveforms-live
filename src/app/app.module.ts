import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

//Modules
import { CoreModule } from './core/core.module';
import { SettingsModule } from '../pages/settings/settings.module';
import { InstrumentPanelModule } from '../pages/instrument-panel/instrument-panel.module';
import { DeviceManagerPageModule } from '../pages/device-manager-page/device-manager-page.module';
import { BodePageModule } from '../pages/bode/bode.module'; 
import { BodeModalPageModule } from '../pages/bode-modal/bode-modal.module';

//Pages


//Services
import { CommandUtilityService } from '../services/device/command-utility.service';

@NgModule({
    declarations: [
        MyApp,
    ],
    imports: [
        CoreModule,
        SettingsModule,
        InstrumentPanelModule,
        DeviceManagerPageModule,
        BodePageModule,
        BodeModalPageModule,
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp
    ],
    providers: [CommandUtilityService]
})
export class AppModule { }

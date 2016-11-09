import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { CoreModule } from './core/core.module';
import { SettingsModule } from '../pages/settings/settings.module';
import { InstrumentPanelModule } from '../pages/test-chart-ctrls/test-chart-ctrls.module';
import { DeviceManagerPageModule } from '../pages/device-manager-page/device-manager-page.module';
import { ProtocolTestPanelModule } from '../pages/protocol-test-panel/protocol-test-panel.module';

import { FlotModule } from '../pages/flot/flot.module';

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    ProtocolTestPanelModule,
    CoreModule,
    SettingsModule,
    InstrumentPanelModule,
    DeviceManagerPageModule,
    FlotModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: []
})
export class AppModule { }

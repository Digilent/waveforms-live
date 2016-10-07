import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { ProtocolTestPanel } from './protocol-test-panel';
import { ChartModal } from './protocol-test-panel';
import { ChartModule } from 'angular2-highcharts';

@NgModule({
    imports: [
        SharedModule,
        ChartModule,
        IonicModule.forRoot(ProtocolTestPanel),
        IonicModule.forRoot(ChartModal)
    ],
    declarations: [
        ProtocolTestPanel,
        ChartModal
    ],
    exports: [
        ProtocolTestPanel
    ]
})
export class ProtocolTestPanelModule { }
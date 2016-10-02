import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { ProtocolTestPanel } from './protocol-test-panel';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(ProtocolTestPanel),
    ],
    declarations: [
        ProtocolTestPanel
    ],
    exports: [
        ProtocolTestPanel
    ]
})
export class ProtocolTestPanelModule { }
import { NgModule } from '@angular/core';

//Components
import { DcSupplyComponent } from './dc-supply.component';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DcSupplyComponent),
    ],
    declarations: [
        DcSupplyComponent
    ],
    exports: [DcSupplyComponent],
    providers: [
    ]
})
export class DcSupplyModule { }
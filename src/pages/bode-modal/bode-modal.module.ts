import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { BodeModalPage } from './bode-modal';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(BodeModalPage)
    ],
    declarations: [
        BodeModalPage
    ],
    exports: [BodeModalPage]
})
export class BodeModalPageModule { }
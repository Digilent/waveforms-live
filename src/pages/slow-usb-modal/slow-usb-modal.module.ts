import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

// Pages
import { SlowUSBModalPage } from './slow-usb-modal';

@NgModule({
    imports: [
        IonicModule.forRoot(SlowUSBModalPage)
    ],
    declarations: [
        SlowUSBModalPage
    ],
    exports: [SlowUSBModalPage]
})
export class SlowUSBModalPageModule {}
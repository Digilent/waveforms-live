import { NgModule } from '@angular/core';

//Components
import { DigitalIoComponent } from './digital-io.component';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(DigitalIoComponent),
    ],
    declarations: [
        DigitalIoComponent
    ],
    exports: [DigitalIoComponent],
    providers: [
    ]
})
export class DigitalIoModule { }
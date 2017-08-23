import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { LoggerPage } from './logger';
 
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(LoggerPage)
    ],
    declarations: [
        LoggerPage
    ],
    exports: [LoggerPage]
})
export class LoggerModule { }
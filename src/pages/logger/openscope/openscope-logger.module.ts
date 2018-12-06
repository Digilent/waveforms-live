import { NgModule } from '@angular/core';
import { SharedModule } from '../../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

// Modules
import { LoggerModule } from '../logger.module';

//Components
import { OpenScopeLoggerComponent } from '../../../components/logger/openscope/openscope-logger.component';

//Pages
import { OpenScopeLoggerPage } from './openscope-logger';
 
@NgModule({
    imports: [
        SharedModule,
        LoggerModule,
        IonicModule.forRoot(OpenScopeLoggerPage)
    ],
    declarations: [
        OpenScopeLoggerPage,
        OpenScopeLoggerComponent
    ],
    exports: [OpenScopeLoggerPage],
    providers: []
})
export class OpenScopeLoggerModule { }
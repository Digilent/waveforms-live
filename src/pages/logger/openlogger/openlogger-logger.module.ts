import { NgModule } from '@angular/core';
import { SharedModule } from '../../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

// Modules
import { LoggerModule } from '../logger.module';
import { FGenModule } from '../../../components/function-gen/function-gen.module';
import { DcSupplyModule } from '../../../components/dc-supply/dc-supply.module';
import { DigitalIoModule } from '../../../components/digital-io/digital-io.module';

//Components
import { OpenLoggerLoggerComponent } from '../../../components/logger/openlogger/openlogger-logger.component';
import { ProfilePopover } from '../../../components/profile-popover/profile-popover.component';

//Pages
import { OpenLoggerLoggerPage } from './openlogger-logger';

//Services
import { ScalingService } from '../../../services/scaling/scaling.service';
 
@NgModule({
    imports: [
        SharedModule,
        LoggerModule,
        FGenModule,
        DcSupplyModule,
        DigitalIoModule,
        IonicModule.forRoot(OpenLoggerLoggerPage),
        IonicModule.forRoot(ProfilePopover)
    ],
    declarations: [
        OpenLoggerLoggerPage,
        OpenLoggerLoggerComponent,
        ProfilePopover
    ],
    exports: [OpenLoggerLoggerPage],
    providers: [
        ScalingService
    ]
})

export class OpenLoggerLoggerModule { }
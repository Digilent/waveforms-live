import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { FGenModule } from '../../components/function-gen/function-gen.module';
import { DcSupplyModule } from '../../components/dc-supply/dc-supply.module';

//Components
import { LoggerComponent } from '../../components/logger/logger.component';
import { LoggerChartComponent } from '../../components/logger-chart/logger-chart.component';
import { LoggerXAxisComponent } from '../../components/logger-xaxis/logger-xaxis.component';
import { LoggerTimelineComponent } from '../../components/logger-timeline/logger-timeline.component';
import { ProfilePopover } from '../../components/profile-popover/profile-popover.component';

//Pages
import { FileBrowserPage } from '../file-browser/file-browser';
import { LoggerPage } from './logger';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';
import { ScalingService } from '../../services/scaling/scaling.service';
 
@NgModule({
    imports: [
        SharedModule,
        FGenModule,
        DcSupplyModule,
        IonicModule.forRoot(LoggerPage),
        IonicModule.forRoot(FileBrowserPage),
        IonicModule.forRoot(ProfilePopover)
    ],
    declarations: [
        LoggerPage,
        LoggerComponent,
        LoggerChartComponent,
        LoggerXAxisComponent,
        LoggerTimelineComponent,
        FileBrowserPage,
        ProfilePopover
    ],
    exports: [LoggerPage],
    providers: [
        LoggerPlotService,
        ScalingService
    ]
})
export class LoggerModule { }
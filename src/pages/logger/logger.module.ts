import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { FGenModule } from '../../components/function-gen/function-gen.module';

//Components
import { LoggerComponent } from '../../components/logger/logger.component';
import { LoggerChartComponent } from '../../components/logger-chart/logger-chart.component';
import { LoggerXAxisComponent } from '../../components/logger-xaxis/logger-xaxis.component';
import { LoggerTimelineComponent } from '../../components/logger-timeline/logger-timeline.component';
import { UnitScaleComponent } from '../../components/unit-scale/unit-scale.component';

//Pages
import { FileBrowserPage } from '../file-browser/file-browser';
import { LoggerPage } from './logger';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';
 
@NgModule({
    imports: [
        SharedModule,
        FGenModule,
        IonicModule.forRoot(LoggerPage),
        IonicModule.forRoot(FileBrowserPage)
    ],
    declarations: [
        LoggerPage,
        LoggerComponent,
        LoggerChartComponent,
        LoggerXAxisComponent,
        LoggerTimelineComponent,
        UnitScaleComponent,
        FileBrowserPage
    ],
    exports: [LoggerPage],
    providers: [
        LoggerPlotService
    ]
})
export class LoggerModule { }
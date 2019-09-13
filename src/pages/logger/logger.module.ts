import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

//Components
import { LoggerChartComponent } from '../../components/logger-chart/logger-chart.component';
import { LoggerXAxisComponent } from '../../components/logger-xaxis/logger-xaxis.component';
import { LoggerTimelineComponent } from '../../components/logger-timeline/logger-timeline.component';

//Pages
import { FileBrowserPage } from '../file-browser/file-browser';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(FileBrowserPage)
    ],
    declarations: [
        LoggerChartComponent,
        LoggerXAxisComponent,
        LoggerTimelineComponent,
        FileBrowserPage
    ],
    exports: [
        LoggerChartComponent,
        LoggerXAxisComponent,
        LoggerTimelineComponent
    ],
    providers: [LoggerPlotService]
})
export class LoggerModule { }
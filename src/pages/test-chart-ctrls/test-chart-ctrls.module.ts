import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { TestChartCtrlsPage } from './test-chart-ctrls';
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { BottomBarComponent } from '../../components/bottom-bar/bottom-bar.component';
import { XAxisComponent } from '../../components/xaxis-controls/xaxis-controls.component';
import { YAxisComponent } from '../../components/yaxis-controls/yaxis-controls.component';
import { TimelineComponent } from '../../components/timeline/timeline.component';
import { TimelineChartComponent } from '../../components/timeline-chart/timeline-chart.component';
import { AutoscaleComponent } from '../../components/autoscale/autoscale.component';
import { TriggerComponent } from '../../components/trigger/trigger.component';
import { FgenComponent } from '../../components/function-gen/function-gen.component';
import { DigitalIoComponent } from '../../components/digital-io/digital-io.component';
import { DcSupplyComponent } from '../../components/dc-supply/dc-supply.component';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(TestChartCtrlsPage)
    ],
    declarations: [
        TestChartCtrlsPage,
        SilverNeedleChart,
        BottomBarComponent,
        XAxisComponent,
        YAxisComponent,
        TimelineComponent,
        TimelineChartComponent,
        AutoscaleComponent,
        TriggerComponent,
        FgenComponent,
        DigitalIoComponent,
        DcSupplyComponent
    ],
    exports: [TestChartCtrlsPage]
})
export class InstrumentPanelModule { }
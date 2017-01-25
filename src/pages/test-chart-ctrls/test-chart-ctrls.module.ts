import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { TestChartCtrlsPage } from './test-chart-ctrls';
import { SilverNeedleChart } from '../../components/chart/chart.component';
import { XAxisComponent } from '../../components/xaxis-controls/xaxis-controls.component';
import { YAxisComponent } from '../../components/yaxis-controls/yaxis-controls.component';
import { TimelineChartComponent } from '../../components/timeline-chart/timeline-chart.component';
import { TriggerComponent } from '../../components/trigger/trigger.component';
import { FgenComponent } from '../../components/function-gen/function-gen.component';
import { DigitalIoComponent } from '../../components/digital-io/digital-io.component';
import { DcSupplyComponent } from '../../components/dc-supply/dc-supply.component';
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { PinoutPopover } from '../../components/pinout-popover/pinout-popover.component';

import { ChartModule } from 'angular2-highcharts';
 
@NgModule({
    imports: [
        SharedModule,
        ChartModule,
        IonicModule.forRoot(TestChartCtrlsPage),
        IonicModule.forRoot(ModalCursorPage),
        IonicModule.forRoot(MathModalPage),
        IonicModule.forRoot(PinoutPopover)
    ],
    declarations: [
        PinoutPopover,
        TestChartCtrlsPage,
        ModalCursorPage,
        MathModalPage,
        SilverNeedleChart,
        XAxisComponent,
        YAxisComponent,
        TimelineChartComponent,
        TriggerComponent,
        FgenComponent,
        DigitalIoComponent,
        DcSupplyComponent
    ],
    exports: [TestChartCtrlsPage]
})
export class InstrumentPanelModule { }
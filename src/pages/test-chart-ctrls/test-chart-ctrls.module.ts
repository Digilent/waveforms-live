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
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { SeriesPopover } from '../../components/series-popover/series-popover.component';
import { TriggerPopover } from '../../components/trigger-popover/trigger-popover.component';
import { DigitalIoPopover } from '../../components/digital-io-popover/digital-io-popover.component';
import { ModalFgenPage } from '../../pages/fgen-modal/fgen-modal';
import { ChartModalPage } from '../../pages/chart-modal/chart-modal';
import { LaComponent } from '../../components/la-controls/la-controls.component';
import { LaPopover } from '../../components/la-popover/la-popover.component';
import { PinoutPopover } from '../../components/pinout-popover/pinout-popover.component';

import { ChartModule } from 'angular2-highcharts';
 
@NgModule({
    imports: [
        SharedModule,
        ChartModule,
        IonicModule.forRoot(TestChartCtrlsPage),
        IonicModule.forRoot(ModalCursorPage),
        IonicModule.forRoot(ChartModalPage),
        IonicModule.forRoot(MathModalPage),
        IonicModule.forRoot(ModalFgenPage),
        IonicModule.forRoot(SeriesPopover),
        IonicModule.forRoot(TriggerPopover),
        IonicModule.forRoot(LaComponent),
        IonicModule.forRoot(LaPopover),
        IonicModule.forRoot(DigitalIoPopover),
        IonicModule.forRoot(PinoutPopover)
    ],
    declarations: [
        LaComponent,
        PinoutPopover,
        LaPopover,
        DigitalIoPopover,
        ChartModalPage,
        TestChartCtrlsPage,
        ModalFgenPage,
        ModalCursorPage,
        MathModalPage,
        TriggerPopover,
        SeriesPopover,
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
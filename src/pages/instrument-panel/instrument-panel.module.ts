import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

import { OpenScopeLoggerModule } from '../logger/openscope/openscope-logger.module';
import { BodePageModule } from '../bode/bode.module'; 
import { BodeModalPageModule } from '../bode-modal/bode-modal.module';
import { SlowUSBModalPageModule } from '../slow-usb-modal/slow-usb-modal.module';

import { InstrumentPanelPage } from './instrument-panel';
import { InstrumentPanelChart } from '../../components/instrument-panel-chart/instrument-panel-chart.component';
import { XAxisComponent } from '../../components/xaxis-controls/xaxis-controls.component';
import { YAxisComponent } from '../../components/yaxis-controls/yaxis-controls.component';
import { TimelineChartComponent } from '../../components/timeline-chart/timeline-chart.component';
import { TriggerComponent } from '../../components/trigger/trigger.component';
import { DigitalIoComponent } from '../../components/digital-io/digital-io.component';
import { DcSupplyModule } from '../../components/dc-supply/dc-supply.module';
import { ModalCursorPage } from '../../pages/cursor-modal/cursor-modal';
import { MathModalPage } from '../../pages/math-modal/math-modal';
import { LaPopover } from '../../components/la-popover/la-popover.component';
import { ChartAnnotationComponent } from '../../components/chart-annotation/chart-annotation.component';
import { FGenModule } from '../../components/function-gen/function-gen.module';
 
@NgModule({
    imports: [
        SharedModule,
        OpenScopeLoggerModule,
        FGenModule,
        DcSupplyModule,
        IonicModule.forRoot(InstrumentPanelPage),
        IonicModule.forRoot(ModalCursorPage),
        IonicModule.forRoot(MathModalPage),
        IonicModule.forRoot(LaPopover),
        IonicModule.forRoot(ChartAnnotationComponent),
        BodePageModule,
        BodeModalPageModule,
        SlowUSBModalPageModule
    ],
    declarations: [
        LaPopover,
        InstrumentPanelPage,
        ModalCursorPage,
        MathModalPage,
        InstrumentPanelChart,
        XAxisComponent,
        YAxisComponent,
        TimelineChartComponent,
        TriggerComponent,
        DigitalIoComponent,
        ChartAnnotationComponent
    ],
    exports: [InstrumentPanelPage]
})
export class InstrumentPanelModule { }
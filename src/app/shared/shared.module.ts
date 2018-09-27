import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';

//Modules
import { DigilentChartModule } from 'digilent-chart-angular2/modules'; 
import { TooltipModule } from '../../directives/tooltip/tooltip.module';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';
import { PinoutPopover } from '../../components/pinout-popover/pinout-popover.component';
import { MathPopoverComponent } from '../../components/math-popover/math-popover.component';
import { CursorPopoverComponent } from '../../components/cursor-popover/cursor-popover.component';
import { CloudLoggingPopover } from '../../components/cloud-logging-popover/cloud-logging-popover.component';

//Directives
import { FormatInputDirective } from '../../directives/format-input/format-input.directive';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';
 
@NgModule({
    imports: [
        CommonModule,
        IonicModule.forRoot(GenPopover),
        IonicModule.forRoot(DropdownPopoverComponent),
        IonicModule.forRoot(ProgressBarComponent),
        IonicModule.forRoot(PinoutPopover),
        IonicModule.forRoot(MathPopoverComponent),
        IonicModule.forRoot(CursorPopoverComponent),
        IonicModule.forRoot(CloudLoggingPopover)
    ],
    declarations: [
        GenPopover,
        DropdownPopoverComponent,
        UnitFormatPipe,
        ProgressBarComponent,
        FormatInputDirective,
        MathPopoverComponent,
        CursorPopoverComponent,
        PinoutPopover,
        CloudLoggingPopover
    ],
    exports: [
        GenPopover,
        UnitFormatPipe,
        DropdownPopoverComponent,
        CommonModule,
        FormsModule,
        TooltipModule,
        ProgressBarComponent,
        DigilentChartModule,
        FormatInputDirective,
        MathPopoverComponent,
        CursorPopoverComponent,
        PinoutPopover,
        CloudLoggingPopover
    ]
})
export class SharedModule { }
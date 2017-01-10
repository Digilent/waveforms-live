import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';
import { TooltipModule } from '../../directives/tooltip/tooltip.module';

import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';
import { DropDownMenu } from '../../libs/digilent-ionic2-utilities/drop-down-menu/drop-down-menu.component';
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

@NgModule({
    imports: [
        CommonModule,
        IonicModule.forRoot(GenPopover),
        IonicModule.forRoot(DropDownMenu),
        IonicModule.forRoot(DropdownPopoverComponent)
    ],
    declarations: [
        GenPopover,
        DropDownMenu,
        DropdownPopoverComponent,
        UnitFormatPipe
    ],
    exports: [
        GenPopover,
        UnitFormatPipe,
        DropDownMenu,
        DropdownPopoverComponent,
        CommonModule,
        FormsModule,
        TooltipModule
    ]
})
export class SharedModule { }
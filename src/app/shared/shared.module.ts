import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';

import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { DropdownPopoverComponent } from '../../components/dropdown-popover/dropdown-popover.component';
import { DropDownMenu } from '../../libs/digilent-ionic2-utilities/drop-down-menu/drop-down-menu.component';
import { VoltageFormatPipe } from '../../pipes/voltage-format.pipe';

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
        VoltageFormatPipe
    ],
    exports: [
        GenPopover,
        VoltageFormatPipe,
        DropDownMenu,
        DropdownPopoverComponent,
        CommonModule,
        FormsModule
    ]
})
export class SharedModule { }
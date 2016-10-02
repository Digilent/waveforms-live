import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';

import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { DropDownMenu } from '../../libs/digilent-ionic2-utilities/drop-down-menu/drop-down-menu.component';

@NgModule({
    imports: [
        CommonModule,
        IonicModule.forRoot(GenPopover),
        IonicModule.forRoot(DropDownMenu)

    ],
    declarations: [
        GenPopover,
        DropDownMenu
    ],
    exports: [
        GenPopover,
        DropDownMenu,
        CommonModule,
        FormsModule
    ]
})
export class SharedModule { }
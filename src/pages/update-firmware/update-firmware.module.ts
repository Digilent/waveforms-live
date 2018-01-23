import { NgModule } from '@angular/core';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';

//Pages
import { UpdateFirmwarePage } from './update-firmware';

//Services
import { CommandUtilityService } from '../../services/device/command-utility.service';

@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(UpdateFirmwarePage)
    ],
    declarations: [
        UpdateFirmwarePage
    ],
    exports: [UpdateFirmwarePage],
    providers: [CommandUtilityService]
})
export class UpdateFirmwareModule { }
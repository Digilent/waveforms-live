import { NgModule } from '@angular/core';

//Components
import { FgenComponent } from './function-gen.component';
import { SharedModule } from '../../app/shared/shared.module';
import { IonicModule } from 'ionic-angular';
 
/**
 * Note(andrew): Because the FgenComponent is used in more than two places (logger & instrument pages)
 * and isn't imported in the AppModule, it needs its own module that gets imported where needed
 */
@NgModule({
    imports: [
        SharedModule,
        IonicModule.forRoot(FgenComponent),
    ],
    declarations: [
        FgenComponent
    ],
    exports: [FgenComponent],
    providers: [
    ]
})
export class FGenModule { }
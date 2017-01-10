import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tooltip } from "./Tooltip";
import { TooltipContent } from "./TooltipContent";

export * from "./Tooltip";
export * from "./TooltipContent";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        Tooltip,
        TooltipContent,
    ],
    exports: [
        Tooltip,
        TooltipContent,
    ],
    entryComponents: [
        TooltipContent
    ]
})
export class TooltipModule {

}
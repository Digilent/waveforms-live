import {
    Directive, HostListener, ComponentRef, ViewContainerRef, Input, ComponentFactoryResolver,
    ComponentFactory
} from "@angular/core";
import {TooltipContent} from "./TooltipContent";

@Directive({
    selector: "[tooltip]"
})
export class Tooltip {

    @Input("tooltip") content: string|TooltipContent;

    @Input() tooltipDisabled: boolean;

    @Input() tooltipAnimation: boolean = true;

    @Input() tooltipPlacement: "top"|"bottom"|"left"|"right" = "bottom";

    private tooltip: ComponentRef<TooltipContent>;
    private visible: boolean;
    private viewContainerRef: ViewContainerRef 
    private resolver: ComponentFactoryResolver
    private timeoutRef;
    private displayDelay: number = 750;

    constructor(_viewContainerRef: ViewContainerRef, _resolver: ComponentFactoryResolver) {
        this.viewContainerRef = _viewContainerRef;
        this.resolver = _resolver;
    }

    @HostListener("focusin")
    @HostListener("mouseenter")
    setTimeout() {
        clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => {
            this.show();
        }, this.displayDelay);
    }


    show(): void {
        if (this.tooltipDisabled || this.visible)
            return;

        this.visible = true;
        if (typeof this.content === "string") {
            const factory = this.resolver.resolveComponentFactory(TooltipContent);
            if (!this.visible)
                return;

            this.tooltip = this.viewContainerRef.createComponent(factory);
            this.tooltip.instance.hostElement = this.viewContainerRef.element.nativeElement;
            this.tooltip.instance.content = this.content as string;
            this.tooltip.instance.placement = this.tooltipPlacement;
            this.tooltip.instance.animation = this.tooltipAnimation;
        } else {
            const tooltip = this.content as TooltipContent;
            tooltip.hostElement = this.viewContainerRef.element.nativeElement;
            tooltip.placement = this.tooltipPlacement;
            tooltip.animation = this.tooltipAnimation;
            tooltip.show();
        }
    }

    clearTimeout() {
        clearTimeout(this.timeoutRef);
    }

    @HostListener("focusout")
    @HostListener("mouseleave")
    hide(): void {
        this.clearTimeout();
        if (!this.visible)
            return;

        this.visible = false;
        if (this.tooltip)
            this.tooltip.destroy();

        if (this.content instanceof TooltipContent)
            (this.content as TooltipContent).hide();
    }

}
import { Directive, HostListener, ComponentRef, ViewContainerRef, Input, ComponentFactoryResolver } from "@angular/core";
import { TooltipContent } from "./TooltipContent";
import { Platform } from 'ionic-angular';

@Directive({
    selector: "[tooltip]"
})
export class Tooltip {

    @Input("tooltip") content: string|TooltipContent;
    @Input() tooltipDisabled: boolean;
    @Input() tooltipAnimation: boolean = true;
    @Input() tooltipPlacement: "top"|"bottom"|"left"|"right" = "bottom";
    @Input() forceShow: boolean = false;
    @Input() forceShowDelay: number = 100;
    @Input() onlyForceShow: boolean = false;

    private tooltip: ComponentRef<TooltipContent>;
    private visible: boolean;
    private viewContainerRef: ViewContainerRef 
    private resolver: ComponentFactoryResolver
    private platform: Platform;
    private timeoutRef;
    private displayDelay: number = 750;
    private mobile: boolean;

    constructor(_viewContainerRef: ViewContainerRef, _resolver: ComponentFactoryResolver, _platform: Platform) {
        this.viewContainerRef = _viewContainerRef;
        this.resolver = _resolver;
        this.platform = _platform;
        this.mobile = this.platform.is('mobile');
    }

    ngOnChanges(changes: any) {
        setTimeout(() => {
            if (changes.forceShow != undefined && changes.forceShow.currentValue) {
                this.show();
            }
            else if (changes.forceShow != undefined && !changes.forceShow.currentValue) {
                this.hide();
            }
        }, this.forceShowDelay);
    }

    @HostListener("focusin")
    @HostListener("mouseenter")
    setShowTimeout() {
        if (this.onlyForceShow) { return; }
        clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => {
            this.show();
        }, this.displayDelay);
    }


    show(): void {
        if (this.tooltipDisabled || this.visible || (this.mobile && !this.forceShow))
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
        if (!this.visible || this.forceShow)
            return;

        this.visible = false;
        if (this.tooltip)
            this.tooltip.destroy();

        if (this.content instanceof TooltipContent)
            (this.content as TooltipContent).hide();
    }

}
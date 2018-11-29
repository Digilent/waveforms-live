import { Component, Output, Input } from "@angular/core";
import { EventEmitter } from "@angular/common/src/facade/async";

import * as math from 'mathjs';
import { ToastService } from "../../services/toast/toast.service";

/**
 * UnitScale accepts a math expression string to convert the voltage into a more domain
 * specific unit, (ie Fahrenheit for an application measuring temperature).
 * 
 * If the user specifies a unit to convert to, the chart y-axis ticks are updated
 * to use the new unit, and data received from the device is transformed
 * (this bit could really be a service, yeah?) from voltage
 * to the new unit.
 */
@Component({
    selector: 'unit-scale',
    templateUrl: 'unit-scale.html'
})
export class UnitScaleComponent {
    public expressionString: string = "1 * v";
    public unitDescriptor: string = "V";

    @Input("running") running: boolean = true;
    @Output("update") expressionUpdated: EventEmitter<any> = new EventEmitter();

    constructor(public toastCtl: ToastService) {}

    // emits an event indicating the expression and/or unit has changed
    public signalUpdate() {
        this.validateExpression();

        if (this.verifyExpression()) {
            try {
                let expression = math.eval(`f(v)=${this.expressionString}`);
                
                expression(2); // note(andrew): test that we can actually use the expression here

                this.expressionUpdated.emit({
                    expression,
                    unit: this.unitDescriptor
                });  
            } catch(e) {
                console.log(e);
                
                this.toastCtl.createToast("scaleInvalidExpression", true);
            } 
        }
    }

    public validateExpression() {
        if (this.expressionString === "") this.expressionString = "v";
        if (this.unitDescriptor === "") this.unitDescriptor = "V";
    }

    public verifyExpression(): boolean {
        return this.expressionString.includes("v") && this.unitDescriptor.length === 1;
    }
}
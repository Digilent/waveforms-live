import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

//Services
import { UtilityService } from '../../services/utility/utility.service';

@Directive({
    selector: '[formatInput]'
})
export class FormatInputDirective {
    @Output('valChange') valChange: EventEmitter<number> = new EventEmitter<number>();
    public ignoreFocusOut: boolean = false;

    constructor(
        private utilService: UtilityService
    ) {

    }

    @HostListener('focusout', ['$event']) onFocusOut(event) {
        if (!this.ignoreFocusOut) {
            this.parseAndEmit(event);
        }
        this.ignoreFocusOut = false;
    }

    @HostListener('keypress', ['$event']) onkeypress(event) {
        if (event.key === 'Enter') {
            this.parseAndEmit(event);
            this.ignoreFocusOut = true;
        }
    }

    private parseAndEmit(event) {
        let val: number = this.utilService.parseBaseNumberVal(event);
        this.valChange.emit(val);
    }
}
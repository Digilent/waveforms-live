import { Injectable, ChangeDetectorRef } from '@angular/core';

@Injectable()
export class UiHelperService {
    
    constructor() {

    }

    /***************************************************************************
     * This method couples the logic to disable a UI button with the generation
     * of a tooltip message explaining why the button is disabled (or the default
     * message if the button isn't disabled)
     * @param btnRefName A variable name from the parent component that will hold
     *  the message 
     * @param resolver A callback method that performs the resolution logic to
     *  determine if a button should be disabled and determines what message to
     *  display, returning the two values as properties on an object
     * @return This function returns an anonymous function that encapsulates the
     *  disabled logic resolution and message generation, and returns the two as
     *  properties on an object
     **************************************************************************/
    public generateDisableCheck(btnRefName: string, resolver: TooltipStateResolver): RefreshElementState {
        return function() {
            let resolvedState = resolver();

            if (this[btnRefName] !== resolvedState.message) {
                Promise.resolve().then(() => { this[btnRefName] = resolvedState.message; }); // note(andrew): Updating this[btnRefName] is Promise wrapped to prevent breaking Angular's Change Detection cycle. 
            }

            return resolvedState;
        }
    }
}

type TooltipStateResolver = () => TooltipStateBundle;

export type RefreshElementState = () => TooltipStateBundle;

export interface TooltipStateBundle {
    message: string;
    isDisabled: boolean;
}
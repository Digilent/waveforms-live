import { Injectable } from '@angular/core';

declare var waveformsLiveDictionary: any;

@Injectable()
export class TooltipService {

    constructor() {
        console.log('tooltip service constructor');
    }

    getTooltip(key: string) {
        return waveformsLiveDictionary.getMessage(key);
    }

}
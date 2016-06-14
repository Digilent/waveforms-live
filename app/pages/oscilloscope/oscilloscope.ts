import {Page} from 'ionic-angular';
import {Component} from '@angular/core';
//Components
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';

@Component({
    templateUrl: 'build/pages/oscilloscope/oscilloscope.html',
    directives: [OscilloscopeComponent]
})
export class OscilloscopePage {
    constructor() {

    }
}

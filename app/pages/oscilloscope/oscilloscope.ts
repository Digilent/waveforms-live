import {Page} from 'ionic-angular';
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';

@Page({
    templateUrl: 'build/pages/oscilloscope/oscilloscope.html',
    directives: [OscilloscopeComponent]
})
export class OscilloscopePage {
    constructor() {

    }
}

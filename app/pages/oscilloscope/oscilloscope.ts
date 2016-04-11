import {Page} from 'ionic-angular';
import {OscilloscopeChartComponent} from '../../components/charts/oscilloscope/oscilloscope-chart.component';

@Page({
    templateUrl: 'build/pages/oscilloscope/oscilloscope.html',
    directives: [OscilloscopeChartComponent]
})
export class OscilloscopePage {
    constructor() {

    }
}

import {Page} from 'ionic-angular';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Page({
    templateUrl: 'build/pages/test-chart/test-chart.html',
    directives: [SilverNeedleChart]
})
export class TestChartPage {
    public controlsVisible = false;
    constructor() {
        
    }
    
}

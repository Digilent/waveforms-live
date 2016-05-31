import {Page} from 'ionic-angular';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Page({
    templateUrl: 'build/pages/test-page/test-page.html',
    directives: [SilverNeedleChart]
})
export class TestPage {

    constructor() {
        
    }
    
}
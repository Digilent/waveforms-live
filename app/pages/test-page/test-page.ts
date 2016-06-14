import {Page} from 'ionic-angular';
import {Component} from '@angular/core';
//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';

@Component({
    templateUrl: 'build/pages/test-page/test-page.html',
    directives: [SilverNeedleChart]
})
export class TestPage {

    constructor() {
        
    }
    
}
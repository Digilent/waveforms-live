import {Page} from 'ionic-angular';
import {Component} from '@angular/core';
//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {BottomBarComponent} from '../../components/bottom-bar/bottom-bar.component'

@Component({
    templateUrl: 'build/pages/test-chart/test-chart.html',
    directives: [SilverNeedleChart, BottomBarComponent]
})
export class TestChartPage {
    public controlsVisible = false;
    constructor() {
        
    }
    
}

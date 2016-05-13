import {Page} from 'ionic-angular';

//Pages
import {ChartComponent} from '../../components/chart/chart.component';

@Page({
  templateUrl: 'build/pages/home/home.html',
  directives: [ChartComponent]
})
export class HomePage {
  constructor() {

  }
}

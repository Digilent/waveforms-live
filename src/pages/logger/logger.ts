import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    private dismissCallback: () => void;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private loggerPlotService: LoggerPlotService
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
    }

    done() {
        this.navCtrl.pop();
    }

    ngOnDestroy() {
        this.loggerPlotService.resetService();
    }

}
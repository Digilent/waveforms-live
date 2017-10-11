import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//Components
import { LoggerComponent } from '../../components/logger/logger.component';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    @ViewChild('loggerComponent') loggerComponent: LoggerComponent;
    private dismissCallback: () => void;
    public running: boolean = false;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private loggerPlotService: LoggerPlotService
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
    }

    snapViewToFront() {
        this.loggerComponent.viewMoved = false;
        this.loggerComponent.setViewToEdge();
        this.loggerPlotService.redrawChart();
    }

    done() {
        this.navCtrl.pop();
    }

    ngOnDestroy() {
        this.loggerPlotService.resetService();
    }

    runLogger() {
        this.loggerComponent.startLogger();
    }

    stopLogger() {
        this.loggerComponent.stopLogger();
    }

    runningValChange(event) {
        this.running = event;
    }

}
import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController, PopoverController } from 'ionic-angular';

//Components
import { LoggerComponent } from '../../components/logger/logger.component';
import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { PinoutPopover } from '../../components/pinout-popover/pinout-popover.component';

//Pages
import { FileBrowserPage } from '../file-browser/file-browser';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    @ViewChild('loggerComponent') loggerComponent: LoggerComponent;
    private dismissCallback: () => void;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private loggerPlotService: LoggerPlotService,
        private modalCtrl: ModalController,
        private popoverCtrl: PopoverController
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

    openFileBrowser() {
        let modal = this.modalCtrl.create(FileBrowserPage);
        modal.present();
    }

    presentExportPop() {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['Export CSV', 'Export PNG']
        });
        popover.onWillDismiss((data) => {
            if (data == null) { return; }
            if (data.option === 'Export CSV') {
                this.loggerComponent.exportCsv('LoggerData');
            }
            else if (data.option === 'Export PNG') {
                this.loggerComponent.exportCanvasAsPng();
            }
        });
        popover.present({
            ev: event
        });
    }

    openDevicePinout(event) {
        let popover = this.popoverCtrl.create(PinoutPopover, undefined, {
            cssClass: 'pinoutPopover'
        });
        popover.present();
    }

}
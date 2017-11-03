import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController, PopoverController } from 'ionic-angular';

//Components
import { LoggerComponent } from '../../components/logger/logger.component';
import { GenPopover } from '../../components/gen-popover/gen-popover.component';
import { PinoutPopover } from '../../components/pinout-popover/pinout-popover.component';
import { MathPopoverComponent, MathPassData, MathChannel, MathOutput, MathInfoType } from '../../components/math-popover/math-popover.component';

//Pages
import { FileBrowserPage } from '../file-browser/file-browser';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Services
import { LoggerPlotService } from '../../services/logger-plot/logger-plot.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

declare var mathFunctions: any;

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    @ViewChild('loggerComponent') loggerComponent: LoggerComponent;
    private dismissCallback: () => void;
    private unitFormatPipeInstance: UnitFormatPipe;
    private selectedMathInfo: MathOutput[] = [];

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private loggerPlotService: LoggerPlotService,
        private modalCtrl: ModalController,
        private popoverCtrl: PopoverController,
        public tooltipService: TooltipService
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
        this.unitFormatPipeInstance = new UnitFormatPipe();
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

    openMathPopover(event) {
        let passData: MathPassData = {
            chart: this.loggerPlotService.chart,
            availableChans: [],
            selectedChan: {
                instrument: 'Analog',
                channel: 1,
                seriesOffset: 0
            },
            addedInfo: []
        };

        for (let i = 0; i < this.loggerComponent.analogChans.length; i++) {
            if (this.loggerComponent.dataContainers[i].data.length > 1) {
                passData.availableChans.push({
                    instrument: 'Analog',
                    channel: i + 1,
                    seriesOffset: i
                });
            }
        }
        for (let i = 0; i < this.loggerComponent.digitalChans.length; i++) {
            if (this.loggerComponent.dataContainers[i + this.loggerComponent.analogChans.length].data.length > 1) {
                passData.availableChans.push({
                    instrument: 'Digital',
                    channel: i + 1,
                    seriesOffset: this.loggerComponent.analogChans.length + i
                });
            }
        }

        let popover = this.popoverCtrl.create(MathPopoverComponent, {
            passData: passData
        });
        popover.onWillDismiss(() => {
            buttonSubjRef.unsubscribe();
        });
        popover.present({
            ev: event
        });
        let buttonSubjRef = popover.instance.buttonSubject.subscribe(
            (data: MathOutput) => {
                console.log(data);
                this.addMathInfo(data);
            },
            (err) => { },
            () => { }
        );
    }

    addMathInfo(mathOutput: MathOutput) {

        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.selectedMathInfo[i].mathInfo === mathOutput.mathInfo && this.selectedMathInfo[i].mathChannel.seriesOffset === mathOutput.mathChannel.seriesOffset) {
                this.selectedMathInfo.splice(i, 1);
                return;
            }
        }
        if (this.selectedMathInfo.length === 4) {
            this.selectedMathInfo.shift();
        }
        this.selectedMathInfo.push(mathOutput);
        this.updateMath();
    }

    updateMath() {
        let extremes = this.loggerPlotService.chart.getAxes().xaxis;
        let chartMin = extremes.min;
        let chartMax = extremes.max;
        for (let i = 0; i < this.selectedMathInfo.length; i++) {
            if (this.loggerComponent.dataContainers[this.selectedMathInfo[i].mathChannel.seriesOffset].data.length < 2) {
                this.selectedMathInfo[i].value = '----';
                continue;
            }
            let seriesNum = this.selectedMathInfo[i].mathChannel.seriesOffset;
            let series = this.loggerPlotService.chart.getData();
            let minIndex = Math.round((chartMin - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
            let maxIndex = Math.round((chartMax - series[seriesNum].data[0][0]) / (series[seriesNum].data[1][0] - series[seriesNum].data[0][0]));
            if (minIndex < 0) {
                minIndex = 0;
            }
            if (minIndex > series[seriesNum].data.length) {
                minIndex = series[seriesNum].data.length - 1;
            }
            if (maxIndex < 0) {
                maxIndex = 0;
            }
            if (maxIndex > series[seriesNum].data.length) {
                maxIndex = series[seriesNum].data.length - 1;
            }
            this.selectedMathInfo[i].value = this.updateMathByName(this.selectedMathInfo[i], maxIndex, minIndex);
        }

    }

    updateMathByName(selectedMathInfoObj: MathOutput, maxIndex: number, minIndex: number) {
        switch (selectedMathInfoObj.mathInfo) {
            case 'Frequency':
                return this.unitFormatPipeInstance.transform(mathFunctions.getFrequency(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'Hz');

            case 'Period':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeriod(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 's');

            case 'Amplitude':
                return this.unitFormatPipeInstance.transform(mathFunctions.getAmplitude(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Peak to Peak':
                return this.unitFormatPipeInstance.transform(mathFunctions.getPeakToPeak(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'Vpp');

            case 'Maximum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMax(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Minimum':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMin(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'Mean':
                return this.unitFormatPipeInstance.transform(mathFunctions.getMean(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            case 'RMS':
                return this.unitFormatPipeInstance.transform(mathFunctions.getRMS(this.loggerPlotService.chart, selectedMathInfoObj.mathChannel.seriesOffset, minIndex, maxIndex), 'V');

            default:
                return 'default'
        }
    }

}
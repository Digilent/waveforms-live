import {ToastController} from 'ionic-angular';
import {ViewChild, ElementRef, Component, Input} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {BottomBarComponent} from '../../components/bottom-bar/bottom-bar.component';
import {XAxisComponent} from '../../components/xaxis-controls/xaxis-controls.component';
import {YAxisComponent} from '../../components/yaxis-controls/yaxis-controls.component';
import {TimelineComponent} from '../../components/timeline/timeline.component';
import {TimelineChartComponent} from '../../components/timeline-chart/timeline-chart.component';
import {DeviceComponent} from '../../components/device/device.component';
import {AutoscaleComponent} from '../../components/autoscale/autoscale.component';
import {TriggerComponent} from '../../components/trigger/trigger.component';
import {FgenComponent} from '../../components/function-gen/function-gen.component';


//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';


@Component({
    templateUrl: 'build/pages/test-chart-ctrls/test-chart-ctrls.html',
    directives: [SilverNeedleChart, BottomBarComponent, XAxisComponent, YAxisComponent, 
    TimelineComponent, TimelineChartComponent, AutoscaleComponent, TriggerComponent, FgenComponent]
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    public controlsVisible = false;
    public botVisible = false;
    public sideVisible = false;
    private running: boolean = false;
    
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    private storage: StorageService;

    private oscopeChans: number[];

    private chartReady: boolean = false;
    private toastCtrl: ToastController;

    constructor(_deviceManagerService: DeviceManagerService, _storage: StorageService, _toastCtrl: ToastController) {
        this.toastCtrl = _toastCtrl;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.storage = _storage;
    }

    //Alert user with toast if no active device is set
    ngOnInit() {
        if (this.deviceManagerService.activeDeviceIndex === undefined) {
            console.log('in if');
            let toast = this.toastCtrl.create({
                message: 'You currently have no device connected. Please visit the settings page.',
                showCloseButton: true
            });

            toast.present();
        }
        else {
            this.oscopeChans = [0, 1];
            this.chartReady = true;
            this.chart1.loadDeviceSpecificValues(this.activeDevice);
        }
    }

    saveTimelineChart(event) {
        this.chart1.onTimelineLoad(event);
    }

    //Toggle sidecontrols
    toggleControls() {
        this.controlsVisible = !this.controlsVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }

    //Toggle bot controls 
    toggleBotControls() {
        this.botVisible = !this.botVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }

    //Run osc single
    singleClick() {
        /*let multipliers = [];
        for (let i = 0; i < this.oscopeChans.length; i++) {
            if (this.chart1.voltageMultipliers[i] === 'mV') {
                multipliers[i] = 1;
            }
            else {
                multipliers[i] = 1/1000;
            }
        }
        this.activeDevice.instruments.osc.runSingle(this.oscopeChans, multipliers).subscribe(
            (data) => {
                //console.log(data);
                this.chart1.clearExtraSeries([0, 1]);
                this.chart1.drawWaveform(0, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][0]);
                this.chart1.drawWaveform(1, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][1]);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        ); */

        this.activeDevice.instruments.osc.setParameters([1], [0], [1]).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        );

        this.activeDevice.instruments.trigger.setParameters(
            [1],
            [{
                instrument: 'osc',
                channel: 1,
                type: 'risingEdge',
                lowerThreshold: -5,
                upperThreshold: 0
            }],
            [{
                osc: [1]
            }]
        ).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        );

        this.activeDevice.instruments.trigger.run([1]).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        );

        this.activeDevice.instruments.trigger.read([1]).subscribe(
            (data) => {
                //console.log(data);
                this.chart1.clearExtraSeries([0]);
                this.chart1.drawWaveform(0, this.activeDevice.instruments.trigger.dataBuffer[this.activeDevice.instruments.trigger.dataBufferWriteIndex - 1][0]);
                //this.chart1.drawWaveform(1, this.activeDevice.instruments.trigger.dataBuffer[this.activeDevice.instruments.trigger.dataBufferWriteIndex - 1][1]);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        );
    }

    //Stream osc buffers
    runClick() {
        console.log('run');
        /*let multipliers = [];
        for (let i = 0; i < this.oscopeChans.length; i++) {
            if (this.chart1.voltageMultipliers[i] === 'mV') {
                multipliers[i] = 1;
            }
            else {
                multipliers[i] = 1 / 1000;
            }
        }
        this.running = true;
        this.activeDevice.instruments.osc.streamRunSingle(this.oscopeChans, multipliers).subscribe(
            (buffer) => {
                this.chart1.drawWaveform(0, this.activeDevice.instruments.trigger.dataBuffer[this.activeDevice.instruments.trigger.dataBufferWriteIndex][0]);
                this.chart1.drawWaveform(1, this.activeDevice.instruments.trigger.dataBuffer[this.activeDevice.instruments.trigger.dataBufferWriteIndex][1]);
            },
            (err) => {
                console.log('OSC Run Single Failed.');
            }
        );*/
    }

    //Stop dc stream
    stopClick() {
        console.log('stop');
        this.running = false;
        this.activeDevice.instruments.osc.stopStream();
    }

    //Export series as csv with file name 'myData'
    exportChart() {
        this.chart1.exportCsv('myData');
    }

    //Enable cursors and timeline view
    initSettings() {
        this.chart1.enableCursors();
        this.chart1.enableTimelineView();
        this.chart1.enableMath();
        this.chart1.redrawChart();
    }
}

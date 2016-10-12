import {ToastController, App} from 'ionic-angular';
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
    templateUrl: 'test-chart-ctrls.html',/*
    directives: [SilverNeedleChart, BottomBarComponent, XAxisComponent, YAxisComponent, 
    TimelineComponent, TimelineChartComponent, AutoscaleComponent, TriggerComponent, FgenComponent]*/
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    public app: App;
    public controlsVisible = false;
    public botVisible = false;
    public sideVisible = false;
    public running: boolean = false;
    
    public deviceManagerService: DeviceManagerService;
    public activeDevice: DeviceComponent;
    public storage: StorageService;

    public oscopeChans: number[];

    public chartReady: boolean = false;
    public toastCtrl: ToastController;

    constructor(_deviceManagerService: DeviceManagerService, _storage: StorageService, _toastCtrl: ToastController, _app: App) {
        this.toastCtrl = _toastCtrl;
        this.app = _app;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.storage = _storage;
    }

    //Alert user with toast if no active device is set
    ngOnInit() {
        this.chart1.enableCursors();
        this.chart1.enableTimelineView();
        this.chart1.enableMath();
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

    ionViewDidEnter() {
        this.app.setTitle('Instrument Panel');
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
        let readArray = [[], [], [], [], []];
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (this.chart1.oscopeChansActive[i]) {
                readArray[0].push(i + 1);
                readArray[1].push(0);
                readArray[2].push(1);
                readArray[3].push(this.activeDevice.instruments.osc.chans[i].sampleFreqMax / 1000);
                readArray[4].push(this.activeDevice.instruments.osc.chans[i].bufferSizeMax);
                //(chans: number[], offsets: number[], gains: number[], sampleFreqs: number[], bufferSizes: number[])
            }
        }
        this.activeDevice.multiCommand(
            {
                osc: {
                    setParameters: [readArray[0], readArray[1], readArray[2], readArray[3], readArray[4]]
                },
                trigger: {
                    setParameters: [
                        [1],
                        [
                            {
                                instrument: 'osc',
                                channel: 1,
                                type: 'risingEdge',
                                lowerThreshold: -5,
                                upperThreshold: 0
                            }
                        ],
                        [
                            {
                                osc: readArray[0],
                                //la: [1]
                            }
                        ]
                    ],
                    single: [[1]]
                }
            }
        ).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('single multi done');
                this.readOscope();
                //this.readLa();
            }
        );

        /*this.activeDevice.instruments.osc.setParameters([1], [0], [1], [this.activeDevice.instruments.osc.chans[0].sampleFreqMax / 1000], [30000]).subscribe(
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

        this.activeDevice.instruments.trigger.single([1]).subscribe(
            (data) => {
                //console.log(data);
            },
            (err) => {
                //console.log(err);
            },
            () => {
                //console.log('binary finished in test chart ctrls');
            }
        );*/

        
    }

    readLa() {
        this.activeDevice.instruments.la.read([1]).subscribe(
            (data) => {
                this.chart1.currentBufferArray.push(this.activeDevice.instruments.la.dataBuffer[this.activeDevice.instruments.la.dataBufferWriteIndex - 1][0]);
                this.chart1.drawWaveform(1, this.activeDevice.instruments.la.dataBuffer[this.activeDevice.instruments.la.dataBufferWriteIndex - 1][0], true);
            },
            (err) => {

            }, 
            () => {}
        );
    }

    readOscope() {
        let readArray = [];
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (this.chart1.oscopeChansActive[i]) {
                readArray.push(i + 1);
            }
        }
        this.activeDevice.instruments.osc.read(readArray).subscribe(
            (data) => {
                let numSeries = [];
                for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
                    if (this.chart1.oscopeChansActive[i]) {
                        numSeries.push(i);
                    }
                }
                this.chart1.clearExtraSeries(numSeries);
                if (this.activeDevice.instruments.osc.dataBufferWriteIndex - 1 < 0) {
                    this.chart1.setCurrentBuffer(this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBuffer.length - 1]);
                    for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
                        if (this.chart1.oscopeChansActive[i] === true) {
                            let initial = performance.now();
                            this.chart1.drawWaveform(i, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBuffer.length - 1][i], true);
                            let final = performance.now();
                            console.log(final - initial);
                            this.chart1.updateSeriesAnchor(i);
                        }
                    }
                }
                else {
                    this.chart1.setCurrentBuffer(this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex - 1]);
                    for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
                        if (this.chart1.oscopeChansActive[i] === true) {
                            let initial = performance.now();
                            this.chart1.drawWaveform(i, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex - 1][i], true);
                            let final = performance.now();
                            console.log((final - initial));
                            this.chart1.updateSeriesAnchor(i);
                        }
                    }
                }

                //this.chart1.drawWaveform(1, this.activeDevice.instruments.trigger.dataBuffer[this.activeDevice.instruments.trigger.dataBufferWriteIndex - 1][1]);
            },
            (err) => {
                console.log(err);
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

    //Enable cursors and timeline view
    initSettings() {
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 200);
    }
}

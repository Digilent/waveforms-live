import {ToastController, App, Platform} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {DeviceComponent} from '../../components/device/device.component';
import {TriggerComponent} from '../../components/trigger/trigger.component';


//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';


@Component({
    templateUrl: 'test-chart-ctrls.html'
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    @ViewChild('triggerComponent') triggerComponent: TriggerComponent;
    public app: App;
    public platform: Platform;
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
    public clickBindReference;

    constructor(_deviceManagerService: DeviceManagerService, _storage: StorageService, _toastCtrl: ToastController, _app: App, _platform: Platform) {
        this.toastCtrl = _toastCtrl;
        this.app = _app;
        this.platform = _platform;
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.storage = _storage;
    }

    requestFullscreen() {
        let conf = confirm("Fullscreen mode?");
        let docelem: any = document.documentElement;

        if (conf == true) {
            if (docelem.requestFullscreen) {
                docelem.requestFullscreen();
            }
            else if (docelem.mozRequestFullScreen) {
                docelem.mozRequestFullScreen();
            }
            else if (docelem.webkitRequestFullScreen) {
                docelem.webkitRequestFullScreen();
            }
            else if (docelem.msRequestFullscreen) {
                docelem.msRequestFullscreen();
            }
        }
        document.getElementById('instrument-panel-container').removeEventListener('click', this.clickBindReference);
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
        if (this.platform.is('ios') || this.platform.is('android')) {
            //Have to create bind reference to remove listener since .bind creates new function reference
            this.clickBindReference = this.requestFullscreen.bind(this);
            document.getElementById('instrument-panel-container').addEventListener('click', this.clickBindReference);
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
        console.log('single clicked');
        let trigSourceArr = this.triggerComponent.triggerSource.split(' ');
        if (trigSourceArr[1] === undefined) {
            trigSourceArr[1] = '1';
        }
        this.triggerComponent.lowerThresh
        this.triggerComponent.upperThresh
        let trigType = this.triggerComponent.edgeDirection + 'Edge';
        let readArray = [[], [], [], [], [], []];
        for (let i = 0; i < this.chart1.oscopeChansActive.length; i++) {
            if (this.chart1.oscopeChansActive[i]) {
                let range = this.chart1.voltsPerDivVals[this.chart1.activeVPDIndex[i]] * 10;
                let j = 0;
                while (range * this.activeDevice.instruments.osc.chans[i].gains[j] > this.activeDevice.instruments.osc.chans[i].adcVpp / 1000) {
                    j++;
                }
                readArray[0].push(i + 1);
                readArray[1].push(0);
                //readArray[2].push(1);
                readArray[2].push(this.activeDevice.instruments.osc.chans[i].gains[j]);
                readArray[3].push(this.activeDevice.instruments.osc.chans[i].sampleFreqMax / 1000);
                readArray[4].push(this.activeDevice.instruments.osc.chans[i].bufferSizeMax);
                readArray[5].push(parseFloat(this.triggerComponent.delay));
            }
            console.log(readArray[2]);
        }
        this.activeDevice.multiCommand(
            {
                osc: {
                    setParameters: [readArray[0], readArray[1], readArray[2], readArray[3], readArray[4], readArray[5]]
                },
                trigger: {
                    setParameters: [
                        [1],
                        [
                            {
                                instrument: trigSourceArr[0],
                                channel: parseInt(trigSourceArr[1]),
                                type: trigType,
                                lowerThreshold: parseInt(this.triggerComponent.lowerThresh),
                                upperThreshold: parseInt(this.triggerComponent.upperThresh)
                                /*instrument: 'osc',
                                channel: 1,
                                type: 'risingEdge',
                                lowerThreshold: -5,
                                upperThreshold: 0*/
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
                console.log(data);
            },
            (err) => {
            },
            () => {
                this.readOscope();
                //this.readLa();
            }
        );

        
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
                console.log(data);
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
                console.log(this.chart1.currentBufferArray);
            },
            (err) => {
                console.log(err);
                let toast = this.toastCtrl.create({
                    message: err,
                    showCloseButton: true
                });
                toast.present();
            },
            () => {
            }
        );
    }

    //Stream osc buffers
    runClick() {
        console.log('run');
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

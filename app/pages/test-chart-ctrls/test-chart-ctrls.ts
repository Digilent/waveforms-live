import {Toast, NavController} from 'ionic-angular';
import {ViewChild, ElementRef, Component} from '@angular/core';

//Components
import {SilverNeedleChart} from '../../components/chart/chart.component';
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';
import {BottomBarComponent} from '../../components/bottom-bar/bottom-bar.component';
import {SideBarComponent} from '../../components/side-bar/side-bar.component';
import {XAxisComponent} from '../../components/xaxis-controls/xaxis-controls.component';
import {YAxisComponent} from '../../components/yaxis-controls/yaxis-controls.component';
import {TimelineComponent} from '../../components/timeline/timeline.component';

import {DeviceComponent} from '../../components/device/device.component';

//Services
import {DeviceManagerService} from '../../services/device/device-manager.service';
import {StorageService} from '../../services/storage/storage.service';


@Component({
    templateUrl: 'build/pages/test-chart-ctrls/test-chart-ctrls.html',
    directives: [SilverNeedleChart, OscilloscopeComponent, BottomBarComponent, SideBarComponent, XAxisComponent, YAxisComponent, TimelineComponent]
})
export class TestChartCtrlsPage {
    @ViewChild('chart1') chart1: SilverNeedleChart;
    @ViewChild('oscopeChartInner') oscopeChartInner: ElementRef;
    private nav: NavController;
    public controlsVisible = false;
    public botVisible = false;
    public sideVisible = false;
    private running: boolean = false;
    
    private deviceManagerService: DeviceManagerService;
    private activeDevice: DeviceComponent;
    private storage: StorageService;

    private oscopeChans: number[];

    private chartReady: boolean = false;

    constructor(_deviceManagerService: DeviceManagerService, _nav: NavController, _storage: StorageService) {
        this.deviceManagerService = _deviceManagerService;
        this.activeDevice = this.deviceManagerService.getActiveDevice();
        this.nav = _nav;
        this.storage = _storage;
    }

    ngOnInit() {
        if (this.deviceManagerService.activeDeviceIndex === undefined) {
            console.log('in if');
            let toast = Toast.create({
                message: 'You currently have no device connected. Please visit the settings page.',
                showCloseButton: true
            });

            this.nav.present(toast);
        }
        else {
            this.oscopeChans = [0, 1];
            this.chartReady = true;
        }
    }

    toggleControls() {
        this.controlsVisible = !this.controlsVisible;
        //this.chart1.options.chart.height = 400;
        //this.chart1.redrawChart();

        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);

        /*
        for (let i = 0; i < 10; i++) {
            this.chart1.redrawChart();
        }
        */
        //console.log(this.controlsVisible);
    }
    
    toggleBotControls() {
        this.botVisible = !this.botVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }

    toggleSideControls() {
        this.sideVisible = !this.sideVisible;
        setTimeout(() => {
            this.chart1.redrawChart();
        }, 550);
    }
    
    toggleSeries(event) {
        this.chart1.chart.series[event.channel].setVisible(event.value, true);
    }

    singleClick() {
        console.log(this.activeDevice.instruments.osc);

        //let chans = this.activeDevice.instruments.osc.chans;
        this.activeDevice.instruments.osc.runSingle(this.oscopeChans).subscribe(
            (buffer) => {
                this.chart1.drawWaveform(0, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][0]);
                this.chart1.drawWaveform(1, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][1]);
            },
            (err) => {
                console.log('OSC Run Single Failed.');
            }
        );
        this.storage.clearAll();
        this.storage.saveData('user1', JSON.stringify({name:'Sam',age:'27 or 28 *shrug*'}));
        this.storage.saveData('user0', JSON.stringify({name:'Dharsan',age:22}));
        this.storage.getData('user0').then((data) => {
            console.log('user0: ' + data);
        });
        this.storage.getData('user1').then((data) => {
            console.log('user1: ' + data);
        });
        
    }

    runClick() {
        console.log('run');
        this.running = true;
        this.activeDevice.instruments.osc.streamRunSingle(this.oscopeChans).subscribe(
            (buffer) => {
                console.log(this.activeDevice.instruments.osc.dataBuffer);
                this.chart1.drawWaveform(0, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][0]);
                this.chart1.drawWaveform(1, this.activeDevice.instruments.osc.dataBuffer[this.activeDevice.instruments.osc.dataBufferWriteIndex][1]);
            },
            (err) => {
                console.log('OSC Run Single Failed.');
            }
        );
    }

    stopClick() {
        console.log('stop');
        this.running = false;
        this.activeDevice.instruments.dc.stopStream();
    }

    exportChart() {
        this.chart1.exportCsv('SamData');
    }

    setTitle() {
        //remove
        this.chart1.setTitle('Sup Son? ¯\\_(ツ)_/¯');
    }

    setContainerRef() {
        console.log('Setting container element ref in chart component');
        this.chart1.setElementRef(this.oscopeChartInner);
        this.chart1.enableCursors();
        this.chart1.enableTimelineView();
    }
}

import { Component, EventEmitter, Input } from '@angular/core';
import { NavParams, ViewController, PopoverController } from 'ionic-angular';

//Components
import { SilverNeedleChart } from '../chart/chart.component';

//Services
import { SettingsService } from '../../services/settings/settings.service';
import { TooltipService } from '../../services/tooltip/tooltip.service';

//Interfaces
import { LockInfoContainer } from './yaxis-controls.interface';

@Component({
    templateUrl: 'yaxis-controls.html',
    selector: 'yaxis-controls'
})
export class YAxisComponent {
    @Input() chart: SilverNeedleChart;
    @Input() running: boolean;
    public settingsService: SettingsService;
    public numSeries: number[] = [0, 1];
    public storageEventListener: EventEmitter<any>;
    public viewCtrl: ViewController;
    public params: NavParams;
    public popoverCtrl: PopoverController;
    public names: string[] = [];
    public showSeriesSettings: boolean[] = [];
    public configHover: boolean = false;
    public timeoutRef: any;
    public showOscSettings: boolean = true;
    public ignoreFocusOut: boolean = false;
    public lockedSampleState: LockInfoContainer[] = [];

    constructor(_viewCtrl: ViewController, _params: NavParams, _popoverCtrl: PopoverController, _settingsSrv: SettingsService, public tooltipService: TooltipService) {
        this.popoverCtrl = _popoverCtrl;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.settingsService = _settingsSrv;
    }

    ngOnInit() {
        for (let i = 0; i < this.chart.oscopeChansActive.length; i++) {
            this.names.push('Ch ' + (i + 1));
            this.showSeriesSettings.push(this.chart.oscopeChansActive[i]);
            this.lockedSampleState[i] = {
                sampleFreqLocked: true,
                sampleSizeLocked: true,
                manualSampleFreq: 0,
                manualSampleSize: 0
            };
        }
    }

    initializeFromGetStatus(getStatusObject: any) {
        for (let channel in getStatusObject.trigger) {
            getStatusObject.trigger[channel].forEach((val, index, array) => {
                if (val.targets != undefined && val.targets.osc != undefined) {
                    for (let i = 0; i < this.chart.oscopeChansActive.length; i++) {
                        console.log(val.targets.osc);
                        console.log(this.chart.oscopeChansActive[i]);
                        console.log(val.targets.osc.indexOf(i + 1));
                        console.log(i);
                        console.log('shoud turn on? ');
                        console.log(val.targets.osc.indexOf(i + 1) > -1 && !this.chart.oscopeChansActive[i]);
                        if (val.targets.osc.indexOf(i + 1) > -1 && !this.chart.oscopeChansActive[i]) {
                            console.log('toggling vis on channel' + i);
                            this.toggleVisibility(i, null);
                        }
                        else if (val.targets.osc.indexOf(i + 1) === -1 && this.chart.oscopeChansActive[i]) {
                            console.log('toggling off channel');
                            this.toggleVisibility(i, null);
                        }
                    }
                }
            });
        }
    }

    toggleSampleLock(channel: number) {
        if (this.lockedSampleState[channel].sampleSizeLocked) {
            this.lockedSampleState[channel].manualSampleSize = this.chart.calculateDataFromWindow().bufferSize;
        }
        this.lockedSampleState[channel].sampleSizeLocked = !this.lockedSampleState[channel].sampleSizeLocked;
    }

    toggleSampleFreqLock(channel: number) {
        if (this.lockedSampleState[channel].sampleFreqLocked) {
            this.lockedSampleState[channel].manualSampleFreq = this.chart.calculateDataFromWindow().sampleFreq;
        }
        this.lockedSampleState[channel].sampleFreqLocked = !this.lockedSampleState[channel].sampleFreqLocked;
    }

    checkForEnter(event, channel: number, inputType: string) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, channel, inputType);
            this.ignoreFocusOut = true;
        }
    }

    sampleCheckForEnter(event, channel, sampleType: 'sampleFreq' | 'numSamples') {
        if (event.key === 'Enter') {
            this.setSample(event, sampleType, channel);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event, channel: number, inputType: string) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, channel, inputType);
        }
        this.ignoreFocusOut = false;
    }

    sampleInputLeave(event, channel, sampleType: 'sampleFreq' | 'numSamples') {
        if (!this.ignoreFocusOut) {
            this.setSample(event, sampleType, channel);
        }
        this.ignoreFocusOut = false;
    }

    setSample(event, sampleType: 'sampleFreq' | 'numSamples', channel) {
        let value = event.target.value;
        let parsedValue: number = parseFloat(value);
        let trueValue = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }
        if (sampleType === 'sampleFreq') {
            trueValue = Math.max(Math.min(trueValue, this.chart.deviceDescriptor.instruments.osc.chans[channel].sampleFreqMax / 1000), this.chart.deviceDescriptor.instruments.osc.chans[channel].sampleFreqMin / 1000);
            this.lockedSampleState[channel].manualSampleFreq = trueValue;
        }
        else if (sampleType === 'numSamples') {
            trueValue = (trueValue % 2) === 0 ? trueValue : trueValue + 1;
            trueValue = Math.max(Math.min(trueValue, this.chart.deviceDescriptor.instruments.osc.chans[channel].bufferSizeMax), 2);
            this.lockedSampleState[channel].manualSampleSize = trueValue;
        }
    }

    formatInputAndUpdate(event, channel: number, inputType: string) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (inputType === 'offset') {
            if (trueValue > this.chart.deviceDescriptor.instruments.osc.chans[channel].inputVoltageMax / 1000) {
                trueValue = this.chart.deviceDescriptor.instruments.osc.chans[channel].inputVoltageMax / 1000;
            }
            else if (trueValue < this.chart.deviceDescriptor.instruments.osc.chans[channel].inputVoltageMin / 1000) {
                trueValue = this.chart.deviceDescriptor.instruments.osc.chans[channel].inputVoltageMin / 1000;
            }
            if (this.chart.voltBase[channel] === trueValue) {
                console.log('the same');
                this.chart.voltBase[channel] = trueValue * 10 + 1;
                setTimeout(() => {
                    this.chart.voltBase[channel] = trueValue;
                }, 1);
                return;
            }
            this.chart.voltBase[channel] = trueValue;
        }
        else if (inputType === 'vpd') {
            if (trueValue < this.chart.voltsPerDivVals[0]) {
                trueValue = this.chart.voltsPerDivVals[0];
            }
            else if (trueValue > this.chart.voltsPerDivVals[this.chart.voltsPerDivVals.length - 1]) {
                trueValue = this.chart.voltsPerDivVals[this.chart.voltsPerDivVals.length - 1];
            }
            if (this.chart.voltDivision[channel] === trueValue) {
                console.log('the same');
                this.chart.voltDivision[channel] = trueValue * 10 + 1;
                setTimeout(() => {
                    this.chart.voltDivision[channel] = trueValue;
                }, 1);
                return;
            }
            this.chart.voltDivision[channel] = trueValue;
            this.chart.setNearestPresetVoltsPerDivVal(trueValue, channel);
        }
        this.chart.setSeriesSettings({
            voltsPerDiv: this.chart.voltDivision[channel],
            voltBase: this.chart.voltBase[channel],
            seriesNum: channel
        });
    }

    getSeriesColor(seriesNum: number) {
        if (this.chart.chart === undefined) {
            return '#535353';
        }
        let series = this.chart.chart.getData();
        if (series[seriesNum].lines.show) {
            return series[seriesNum].color;
        }
        return '#535353';
    }

    toggleOscSettings() {
        this.showOscSettings = !this.showOscSettings;
    }

    toggleSeriesSettings(seriesNum: number) {
        console.log('toggle series settings' + seriesNum);
        this.showSeriesSettings[seriesNum] = !this.showSeriesSettings[seriesNum];
    }

    toggleVisibility(seriesNum: number, event) {
        this.chart.toggleVisibility(seriesNum);
    }

    //Called when series settings are changed. Updates chart series settings
    seriesChanged(seriesNum: number) {
        this.chart.setSeriesSettings({
            seriesNum: seriesNum,
            voltsPerDiv: this.chart.voltDivision[seriesNum],
            voltBase: this.chart.voltBase[seriesNum]
        });
    }

    //Set active series on the chart component
    setActiveSeries(i) {
        this.chart.setActiveSeries(i + 1);
    }
}
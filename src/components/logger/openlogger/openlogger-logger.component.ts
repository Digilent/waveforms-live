import { Component, ViewChild, ViewChildren, QueryList, Input } from '@angular/core';
import { AlertController, PopoverController, Events } from 'ionic-angular';
import { LoadingService } from '../../../services/loading/loading.service';
import { ToastService } from '../../../services/toast/toast.service';
import 'rxjs/Rx';

//Components
import { DropdownPopoverComponent } from '../../dropdown-popover/dropdown-popover.component';
import { ProfilePopover } from '../../../components/profile-popover/profile-popover.component';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { UtilityService } from '../../../services/utility/utility.service';
import { LoggerPlotService } from '../../../services/logger-plot/logger-plot.service';
import { ExportService } from '../../../services/export/export.service';
import { SettingsService } from '../../../services/settings/settings.service';
import { TooltipService } from '../../../services/tooltip/tooltip.service';
import { ScalingService } from '../../../services/scaling/scaling.service';

//Interfaces
import { PlotDataContainer } from '../../../services/logger-plot/logger-plot.service';
import { ScaleParams } from '../../../services/scaling/scaling.service';
import { LoggerXAxisComponent } from '../../logger-xaxis/logger-xaxis.component';
import { ChannelSelectPopover } from '../../channel-select-popover/channel-select-popover.component';
import { LogScalePopover } from '../../log-scale-popover/log-scale-popover.component';

@Component({
    templateUrl: 'openlogger-logger.html',
    selector: 'openlogger-logger-component'
})
export class OpenLoggerLoggerComponent {
    @ViewChild('dropPopMode') modeChild: DropdownPopoverComponent;
    @ViewChild('dropPopProfile') profileChild: DropdownPopoverComponent;
    @ViewChild('dropPopLogTo') logToChild: DropdownPopoverComponent;
    @ViewChild('xaxis') xAxis: LoggerXAxisComponent;
    @ViewChildren('dropPopScaling') scalingChildren: QueryList<DropdownPopoverComponent>;
    @Input() colorArray: any;

    private activeDevice: DeviceService;
    public showLoggerSettings: boolean = true;
    public showAdvSettings: boolean = false;
    public selectedChannels: boolean[] = [];

    private daqParams: DaqLoggerParams = {
        maxSampleCount: -1,
        startDelay: 0,
        sampleFreq: 1000,
        storageLocation: 'ram',
        uri: ''
    };
    private defaultDaqChannelParams: DaqChannelParams = {
        average: 1,
        vOffset: 0
    };
    public daqChans: DaqChannelParams[] = [];
    public loggerState: string = 'idle';
    public averagingEnabled: boolean = false;
    public maxAverage: number = 256;
    
    public startIndex: number = 0;
    public count: number = 0;
    private daqChanNumbers: number[] = [];
    // TODO: add SD when implemented
    public logToLocations: string[] = ['chart'];
    public logAndStream: boolean = false;
    public modes: ('continuous' | 'finite')[] = ['continuous', 'finite'];
    public selectedMode: 'continuous' | 'finite' = this.modes[0];
    public selectedLogLocation: string = this.logToLocations[0];
    public storageLocations: string[] = [];
    public loggingProfiles: string[] = ['New Profile'];
    public selectedLogProfile: string = this.loggingProfiles[0];
    public logOnBootProfiles: string[] = ['None'];
    public selectedLogOnBoot: string = this.logOnBootProfiles[0];
    private dirtyProfile: boolean = false;
    private profileObjectMap: any = {};
    public running: boolean = false;
    public dataContainers: PlotDataContainer[] = [];
    public viewMoved: boolean = false;
    private daqChansToRead: number[] = [];
    private chartPanSubscriptionRef;
    private offsetChangeSubscriptionRef;
    private scalingOptions: string[] = ['None'];
    private selectedScales: string[];
    private unitTransformer: any[] = [];

    private filesInStorage: any = {};
    private destroyed: boolean = false;
    public dataAvailable: boolean = false;
    private chanSelectTimer;

    public messageQueue: any[] = [];

    constructor(
        private devicemanagerService: DeviceManagerService,
        private loadingService: LoadingService,
        private toastService: ToastService,
        private utilityService: UtilityService,
        public loggerPlotService: LoggerPlotService,
        private exportService: ExportService,
        private alertCtrl: AlertController,
        private settingsService: SettingsService,
        public tooltipService: TooltipService,
        private popoverCtrl: PopoverController,
        public events: Events,
        private scalingService: ScalingService
    ) {
        this.activeDevice = this.devicemanagerService.devices[this.devicemanagerService.activeDeviceIndex];
        console.log(this.activeDevice.instruments.logger); 
        let loading = this.loadingService.displayLoading('Loading device info...');
        this.init();
        this.loadDeviceInfo()
            .then((data) => {
                console.log(data);
                loading.dismiss();
                if (this.running) {
                    this.continueStream();
                }
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('deviceDroppedConnection', true, undefined, 5000);
                loading.dismiss();
            });

        this.chanUnits = this.daqChans.map(() => 'V');

        this.events.subscribe('profile:save', (params) => {
            this.saveAndSetProfile(params[0]['profileName'], params[0]['saveChart'], params[0]['saveDaq']);
        });
        this.events.subscribe('profile:delete', (params) => {
            this.deleteProfile(params[0]['profileName']);
        });
        this.events.subscribe('channels:selected', (params) => {
            this.selectChannels(params[0]['channels']);
        });
        this.events.subscribe('scale:update', (event) => {
            let params = event[0]['params'];
            let channel = event[0]['channel'];
            this.updateScale(channel, params['expression'], params['name'], params['unitDescriptor']);
        });
        this.events.subscribe('scale:delete', (params) => {
            this.deleteScale(params[0]['channel'], params[0]['name']);
        });
    }

    public selectChannels(selectedChans: boolean[]) {
        this.selectedChannels = selectedChans;
        window.clearTimeout(this.chanSelectTimer);

        if (this.selectedChannels.indexOf(true) > -1) {
            let currentVal = this.daqParams.sampleFreq;
            let newVal = this.validateAndApply(this.daqParams.sampleFreq, 'sampleFreq');

            if (currentVal > newVal) {
                this.chanSelectTimer = window.setTimeout(() => {
                    let numChans = this.selectedChannels.lastIndexOf(true) + 1;
                    let chanObj = this.activeDevice.instruments.logger.daq.chans[0];
                    let maxAggregate = this.getMaxSampleFreq();
                    let maxFreq = Math.floor(maxAggregate / numChans) * chanObj.sampleFreqUnits;   

                    this.toastService.createToast('loggerSampleFreqMax', true, Math.round((maxFreq / 1000) * 100) / 100 + ' kS/s', 5000);
                }, 1500);
            }
        }
    }

    chanUnits: string[] = []; // start w/ 'V' for all the channels
    public updateScale(chan: number, expression: string, scaleName: string, units: string) {
        this.selectedScales[chan] = scaleName;
        this.selectedScales.forEach((chanScale, index) => {
            if (chanScale == scaleName) {
                this.unitTransformer[index] = expression;
                this.events.publish('units:update', { channel: index, units: units });
            }
        });

        // add name to list if new
        if (this.scalingOptions.indexOf(scaleName) === -1) {
            this.scalingOptions.push(scaleName);
        }
        // set dropdown selection
        setTimeout(() => {
            this.scalingChildren.toArray()[chan]._applyActiveSelection(scaleName);
        }, 20);
    }

    public deleteScale(chan: number, scaleName: string) {
        this.unitTransformer[chan] = undefined;

        // remove name from list
        let nameIndex: number = this.scalingOptions.indexOf(scaleName);
        if (nameIndex !== -1) {
            this.scalingOptions.splice(nameIndex, 1);
        }

        // update any channels that were set to the delete option
        this.selectedScales.forEach((chanScale, index) => {
            if (chanScale == scaleName) {
                this.selectedScales[index] = this.scalingOptions[0];
                this.events.publish('units:update', { channel: index });
            }
        });
    }

    ngDoCheck() {
        // Check if there are unsaved changes to profile
        this.dirtyProfile = false;
        if (this.selectedLogProfile && this.selectedLogProfile != this.loggingProfiles[0]) {
            let current = this.generateProfileJson(this.profileObjectMap[this.selectedLogProfile].chart, this.profileObjectMap[this.selectedLogProfile].daq);
            this.dirtyProfile = JSON.stringify(current) !== JSON.stringify(this.profileObjectMap[this.selectedLogProfile]);
        }
    }

    ngOnDestroy() {
        this.clearChart();
        this.chartPanSubscriptionRef.unsubscribe();
        this.offsetChangeSubscriptionRef.unsubscribe();
        this.events.unsubscribe('profile:save');
        this.events.unsubscribe('profile:delete');
        this.events.unsubscribe('channels:selected');
        this.events.unsubscribe('scale:update');
        this.events.unsubscribe('scale:delete');
        this.running = false;
        this.destroyed = true;
    }

    private init() {
        this.chartPanSubscriptionRef = this.loggerPlotService.chartPan.subscribe(
            (data) => {
                if (this.running) {
                    this.viewMoved = true;
                }
            },
            (err) => { },
            () => { }
        );
        this.offsetChangeSubscriptionRef = this.loggerPlotService.offsetChange.subscribe(
            (data) => {
                if (data.axisNum > this.daqChans.length - 1) {
                    //Digital
                    return;
                }
                else {
                    this.daqChans[data.axisNum].vOffset = data.offset;
                }
            },
            (err) => { },
            () => { }
        );

        for (let i = 0; i < this.activeDevice.instruments.logger.daq.numChans; i++) {
            this.daqChans.push(Object.assign({}, this.defaultDaqChannelParams));
        }

        for (let i = 0; i < this.daqChans.length; i++) {
            this.daqChanNumbers.push(i + 1);
            this.dataContainers.push({
                data: [],
                yaxis: i + 1,
                lines: {
                    show: true
                },
                points: {
                    show: false
                },
                seriesOffset: 0
            });
        }

        this.selectedChannels = Array.apply(null, Array(this.daqChans.length)).map(() => false);

        // load saved scaling functions
        this.scalingService.getAllScalingOptions()
            .then((result: ScaleParams[]) => {
                result.forEach((option) => {
                    this.scalingOptions.push(option.name);
                });
            })
            .catch((e) => {
                console.log(e);
            });

        this.selectedScales = Array.apply(null, Array(this.daqChans.length)).map(() => this.scalingOptions[0]);
    }

    private loadDeviceInfo(): Promise<any> {
        return new Promise((resolve, reject) => {
            let daqChanArray = [];
            for (let i = 0; i < this.daqChans.length; i++) {
                daqChanArray.push(i + 1);
            }
            if (daqChanArray.length < 1) {
                resolve('done');
                return;
            }

            this.getStorageLocations()
                .then((data) => {
                    console.log(data);

                    if (data && data.device && data.device[0]) {
                        data.device[0].storageLocations.forEach((el, index, arr) => {
                            if (el !== 'flash') {
                                this.storageLocations.unshift(el);
                            }
                        });
                    }

                    if (this.storageLocations.length < 1) {
                        this.logToLocations = ['chart'];
                        this.logToSelect('chart');
                        return new Promise((resolve, reject) => { resolve(); });
                    }
                    else {
                        return new Promise((resolve, reject) => {
                            this.storageLocations.reduce((accumulator, currentVal, currentIndex) => {
                                return accumulator
                                    .then((data) => {
                                        return this.listDir(currentVal, '/');
                                    })
                                    .catch((e) => {
                                        return this.listDir(currentVal, '/');
                                    });
                            }, Promise.resolve())
                                .then((data) => {
                                    console.log('DONE READING STORAGE LOCATIONS');
                                    resolve();
                                })
                                .catch((e) => {
                                    console.log(e);
                                    resolve();
                                });
                        });
                    }
                })
                .then((data) => {
                    console.log(data);
                    return this.getCurrentState(daqChanArray);
                })
                .catch((e) => {
                    console.log(e);
                    if (this.storageLocations.length < 1) {
                        this.logToLocations = ['chart'];
                        this.logToSelect('chart');
                    }
                    return this.getCurrentState(daqChanArray);
                })
                .then((data) => {
                    console.log(data);
                    return this.loadProfilesFromDevice();
                })
                .then((data) => {
                    console.log(data);
                    resolve(data);
                })
                .catch((e) => {
                    console.log(e);
                    reject(e);
                });
        });
    }

    openChannelSelector(event) {
        let popover = this.popoverCtrl.create(ChannelSelectPopover, { selectedChannels: this.selectedChannels, colorArray: this.colorArray }, {
            cssClass: 'logChannelsPopover'
        });
        popover.present({
            ev: event
        });
    }

    public scaleSelect(event: string, channel: number) {
        let currentScale = this.selectedScales[channel];
        this.selectedScales[channel] = event;
        if (event === 'None') {
            // remove scaling on this channel and reset units
            this.unitTransformer[channel] = undefined;
            this.events.publish('units:update', { channel: channel });

            this.chanUnits[channel] = 'V';
        } else {
            // apply expression to this channel and update units
            this.scalingService.getScalingOption(event)
                .then((result) => {
                    // apply scaling to this channel
                    this.unitTransformer[channel] = result.expression;
                    this.events.publish('units:update', { channel: channel, units: result.unitDescriptor });

                    this.chanUnits[channel] = result.unitDescriptor;
                })
                .catch(() => {
                    this.toastService.createToast('loggerScaleLoadErr', true, undefined, 5000);
                    this.selectedScales[channel] = currentScale;
                    setTimeout(() => {
                        this.scalingChildren.toArray()[channel]._applyActiveSelection(currentScale);
                    }, 20);
                    return;
                });
        }
    }

    openScaleSettings(event: any, chan: number, newScale: boolean) {
        let scaleData = { channel: chan };
        if (!newScale) {
            scaleData['scaleName'] = this.selectedScales[chan];
        }
        let popover = this.popoverCtrl.create(LogScalePopover, scaleData, {
            cssClass: 'logScalePopover'
        });
        popover.present({
            ev: event
        });
    }

    continueStream() {
        if (!this.running) { return; }
        
        //Device was in stream mode and should be ready to stream
        this.daqChansToRead = this.selectedChannels.reduce((chanArray, isSelected, i) => {
            if (isSelected) {
                chanArray.push(i + 1);
            }
            return chanArray;
        }, []);
        if (this.daqChansToRead !== []) {
            this.count = -1000;
        }

        if (this.selectedLogLocation === 'SD') {
            this.logAndStream = true;
            this.bothStartStream();
        }
        this.readLiveData();
    }

    fileExists(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.alertWrapper('File Exists', 'Your log file already exists. Would you like to overwrite or cancel?',
                [{
                    text: 'Cancel',
                    handler: (data) => {
                        reject();
                    }
                },
                {
                    text: 'Overwrite',
                    handler: (data) => {
                        resolve();
                    }
                }]
            );
        });
    }

    private alertWrapper(title: string, subTitle: string, buttons?: { text: string, handler: (data) => void }[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let alert = this.alertCtrl.create({
                title: title,
                subTitle: subTitle,
                buttons: buttons == undefined ? ['OK'] : <any>buttons
            });
            alert.onWillDismiss((data) => {
                resolve(data);
            });
            alert.present();
        });
    }

    xAxisValChange(event) {
        console.log(event);
        this.loggerPlotService.setValPerDivAndUpdate('x', 1, event);
    }

    yAxisValChange(trueValue, axisNum: number) {
        console.log(trueValue);
        if (trueValue < this.loggerPlotService.vpdArray[0]) {
            trueValue = this.loggerPlotService.vpdArray[0];
        }
        else if (trueValue > this.loggerPlotService.vpdArray[this.loggerPlotService.vpdArray.length - 1]) {
            trueValue = this.loggerPlotService.vpdArray[this.loggerPlotService.vpdArray.length - 1];
        }
        if (this.loggerPlotService.vpdArray[this.loggerPlotService.vpdIndices[axisNum]] === trueValue) {
            console.log('the same');
            /* this.chart.timeDivision = trueValue * 10 + 1;
            setTimeout(() => {
                this.chart.timeDivision = trueValue;
            }, 1); */
            return;
        }
        this.loggerPlotService.setValPerDivAndUpdate('y', axisNum + 1, trueValue);
        /* this.chart.timeDivision = trueValue;
        this.chart.setNearestPresetSecPerDivVal(trueValue);

        this.chart.setTimeSettings({
            timePerDiv: this.chart.timeDivision,
            base: this.chart.base
        }, false); */
    }

    mousewheel(event, input: 'offset' | 'sampleFreq' | 'samples' | 'vpd', axisNum?: number) {
        event.preventDefault();

        if (input === 'offset') {
            this.buttonChangeOffset(axisNum, event.deltaY < 0 ? 'increment' : 'decrement');
            return;
        }
        if (event.deltaY < 0) {
            input === 'vpd' ? this.decrementVpd(axisNum) : this.incrementFrequency(input);
        }
        else {
            input === 'vpd' ? this.incrementVpd(axisNum) : this.decrementFrequency(input);
        }
    }

    incrementVpd(axisNum: number) {
        if (this.loggerPlotService.vpdIndices[axisNum] > this.loggerPlotService.vpdArray.length - 2) { return; }
        this.loggerPlotService.setValPerDivAndUpdate('y', axisNum + 1, this.loggerPlotService.vpdArray[this.loggerPlotService.vpdIndices[axisNum] + 1]);
    }

    decrementVpd(axisNum: number) {
        if (this.loggerPlotService.vpdIndices[axisNum] < 1) { return; }
        this.loggerPlotService.setValPerDivAndUpdate('y', axisNum + 1, this.loggerPlotService.vpdArray[this.loggerPlotService.vpdIndices[axisNum] - 1]);
    }

    buttonChangeOffset(axisNum: number, type: 'increment' | 'decrement') {
        this.daqChans[axisNum].vOffset += type === 'increment' ? 0.1 : -0.1;
        this.loggerPlotService.setPosition('y', axisNum + 1, this.daqChans[axisNum].vOffset, true);
    }

    incrementFrequency(type: 'sampleFreq' | 'samples') {
        let valString = type === 'sampleFreq' ? this.daqParams.sampleFreq.toString() : this.daqParams.maxSampleCount.toString();
        let valNum = parseFloat(valString);
        let pow = 0;
        while (valNum * Math.pow(1000, pow) < 1) {
            pow++;
        }
        valString = (valNum * Math.pow(1000, pow)).toString();
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;
        leadingNum++;
        if (leadingNum === 10) {
            leadingNum = 1;
            numberMag++;
        }
        let newFreq = (leadingNum * Math.pow(10, numberMag)) / Math.pow(1000, pow);
        this.validateAndApply(newFreq, type);
    }

    private getMaxSampleFreq(): number {
        let targets = this.activeDevice.instruments.logger.daq.targets;
        let max;
        if (this.selectedLogLocation === 'chart') {
            max = targets.ram.sampleFreqMax;
        } else if (this.selectedLogLocation === 'SD') {
            max = targets.sd0.sampleFreqMax;
        } else {
            max = this.activeDevice.instruments.logger.daq.chans[0].sampleFreqMax;
        }
        return max;
    }

    private validateAndApply(newVal: number, type: 'sampleFreq' | 'samples'): number {
        if (type === 'sampleFreq') {
            let chanObj = this.activeDevice.instruments.logger.daq.chans[0];
            let maxAggregate = this.getMaxSampleFreq();
            let numChans = this.selectedChannels.lastIndexOf(true) + 1;
            let minFreq = chanObj.sampleFreqMin * chanObj.sampleFreqUnits;
            let maxFreq = Math.floor(maxAggregate / numChans) * chanObj.sampleFreqUnits;
            if (newVal < minFreq) {
                newVal = minFreq;
            }
            else if (newVal > maxFreq) {
                newVal = maxFreq;
            }
            this.daqParams.sampleFreq = newVal;
        }
        else if (type === 'samples') {
            // TODO: get maxSampleSize from instrument before setting

            // let chanObj = this.activeDevice.instruments.logger[instrument].chans[axisNum];
            // let maxSampleSize = axisObj.storageLocation === 'ram' ? chanObj.bufferSizeMax : 2000000000; //2gb fat
            if (newVal < 1) {
                newVal = 1;
            }
            // else if (newVal > maxSampleSize) {
            //     newVal = maxSampleSize;
            // }
            this.daqParams.maxSampleCount = newVal;
        }
        return newVal;
    }

    decrementFrequency(type: 'sampleFreq' | 'samples') {
        let valString = type === 'sampleFreq' ? this.daqParams.sampleFreq.toString() : this.daqParams.maxSampleCount.toString();
        let valNum = parseFloat(valString);
        let pow = 0;
        while (valNum * Math.pow(1000, pow) < 1) {
            pow++;
        }
        valString = (valNum * Math.pow(1000, pow)).toString();
        let leadingNum = parseInt(valString.charAt(0), 10);
        let numberMag = valString.split('.')[0].length - 1;
        leadingNum--;
        if (leadingNum === 0) {
            leadingNum = 9;
            numberMag--;
        }
        let newFreq = (leadingNum * Math.pow(10, numberMag)) / Math.pow(1000, pow);
        this.validateAndApply(newFreq, type);
    }

    setViewToEdge() {
        if (this.viewMoved) { return; }

        let index = this.selectedChannels.findIndex((e) => e);
        
        if (!this.dataAvailable || index === -1 || this.dataContainers[index].data[0] == undefined || this.dataContainers[index].data[0][0] == undefined) {
            //Data was cleared
            this.loggerPlotService.setPosition('x', 1, this.loggerPlotService.xAxis.base * 5, true);
            return;
        }

        let rightPos = this.dataContainers[index].data[this.dataContainers[index].data.length - 1][0];
        for (let i = 1; i < this.dataContainers.length; i++) {
            let len = this.dataContainers[i].data.length - 1;
            
            if (len <= 0) continue;

            let tempRightPos = this.dataContainers[i].data[this.dataContainers[i].data.length - 1][0];
            rightPos = tempRightPos > rightPos ? tempRightPos : rightPos;
        }

        let span = this.loggerPlotService.xAxis.base * 10;
        let leftPos = rightPos - span;
        if (leftPos < 0) { return; }

        let newPos = (rightPos + leftPos) / 2;

        this.loggerPlotService.setPosition('x', 1, newPos, false);
    }

    logToSelect(event) {
        console.log(event);
        if (this.selectedLogLocation === 'chart' && event !== 'chart') {
            this.daqParams.storageLocation = this.storageLocations[0];
        }
        if (event === 'chart') {
            this.daqParams.storageLocation = 'ram';
        }
        this.selectedLogLocation = event;
    }

    updateUri(event) {
        let uri = event.target.value;
        this.daqParams.uri = uri;
    }

    modeSelect(event: 'finite' | 'continuous') {
        console.log(event);
        if (event === 'finite') {
            this.daqParams.maxSampleCount = 1000;
        }
        else {
            this.daqParams.maxSampleCount = -1;
        }
        this.selectedMode = event;
    }

    openProfileSettings(name, event?) {
        let popover = this.popoverCtrl.create(ProfilePopover, { profileName: name, profileObj: this.profileObjectMap[name] }, {
            cssClass: 'profilePopover'
        });
        popover.present({
            ev: event
        });
    }

    public profileSaveClick(name, event) {
        // if new profile open popover, otherwise just save
        if (name === 'New Profile') {
            this.openProfileSettings('', event);
        } else {
            this.saveAndSetProfile(name, this.profileObjectMap[name].chart !== undefined, this.profileObjectMap[name].daq !== undefined);
        }
    }

    profileSelect(event) {
        console.log(event);
        let currentLogProfile = this.selectedLogProfile;
        this.selectedLogProfile = event;
        if (event === this.loggingProfiles[0]) {
            this.openProfileSettings('');
            return;
        }
        if (this.profileObjectMap[event] == undefined) {
            this.toastService.createToast('loggerProfileLoadErr', true, undefined, 5000);
            console.log('profile not found in profile map');
            this.selectedLogProfile = currentLogProfile;
            setTimeout(() => {
                this.profileChild._applyActiveSelection(this.selectedLogProfile);
            }, 20);
            return;
        }
        //Need to copy so further edits do not overwrite profile info
        this.parseAndApplyProfileJson(JSON.parse(JSON.stringify(this.profileObjectMap[event])));
    }

    deleteProfile(profileName) {
        this.activeDevice.file.delete('flash', this.settingsService.profileToken + profileName + '.json').subscribe(
            (data) => {
                console.log(data);
                // remove from list of profiles
                let nameIndex: number = this.loggingProfiles.indexOf(profileName);
                if (nameIndex !== -1) {
                    this.loggingProfiles.splice(nameIndex, 1);
                    this.logOnBootProfiles.splice(nameIndex, 1);
                }
                this.selectedLogProfile = this.loggingProfiles[0];
            },
            (err) => {
                console.log(err);
                this.toastService.createToast('fileDeleteErr', true, undefined, 5000);
            },
            () => { }
        );
    }

    saveAndSetProfile(profileName, saveChart, saveDaq) {
        console.log(profileName);
        this.saveProfile(profileName, saveChart, saveDaq)
            .then((data) => {
                this.toastService.createToast('loggerSaveSuccess');
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('loggerSaveFail');
            });
        let nameIndex: number = this.loggingProfiles.indexOf(profileName);
        if (nameIndex !== -1) {
            this.loggingProfiles.splice(nameIndex, 1);
            this.logOnBootProfiles.splice(nameIndex, 1);
        }
        this.loggingProfiles.push(profileName);
        this.logOnBootProfiles.push(profileName);
        let profileObj = this.generateProfileJson(saveChart, saveDaq);
        let profileObjCopy = JSON.parse(JSON.stringify(profileObj));
        this.profileObjectMap[profileName] = profileObjCopy;
        setTimeout(() => {
            this.selectedLogProfile = profileName;
            this.profileChild._applyActiveSelection(this.selectedLogProfile);
        }, 20);
    }

    loadProfilesFromDevice(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.listDir('flash', '/')
                .then((data) => {
                    console.log(data);
                    let profileFileNames = [];
                    for (let i = 0; i < data.file[0].files.length; i++) {
                        if (data.file[0].files[i].indexOf(this.settingsService.profileToken) !== -1) {
                            profileFileNames.push(data.file[0].files[i].replace(this.settingsService.profileToken, ''));
                        }
                    }
                    console.log(profileFileNames);
                    profileFileNames.reduce((accumulator, currentVal, currentIndex) => {
                        return accumulator
                            .then((data) => {
                                console.log(data);
                                return this.readProfile(currentVal);
                            })
                            .catch((e) => {
                                console.log(e);
                                return this.readProfile(currentVal);
                            });
                    }, Promise.resolve())
                        .then((data) => {
                            console.log(data);
                            resolve(data);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    private readProfile(profileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.read('flash', this.settingsService.profileToken + profileName, 0, -1).subscribe(
                (data) => {
                    console.log(data);
                    let parsedData;
                    try {
                        parsedData = JSON.parse(data.file);
                    }
                    catch (e) {
                        console.log('error parsing json');
                        resolve(e);
                        return;
                    }
                    let splitArray = profileName.split('.');
                    if (splitArray.length < 2) {
                        this.loggingProfiles.push(profileName);
                        this.logOnBootProfiles.push(profileName);
                        this.profileObjectMap[profileName] = parsedData;
                    }
                    else {
                        splitArray.splice(splitArray.length - 1, 1);
                        let noExtName = splitArray.join('');
                        this.loggingProfiles.push(noExtName);
                        this.logOnBootProfiles.push(noExtName);
                        this.profileObjectMap[noExtName] = parsedData;
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    resolve(err);
                },
                () => { }
            );
        });
    }

    generateProfileJson(saveChart, saveDaq) {
        let saveObj = {};
        if (saveChart) {
            saveObj['chart'] = {
                tpd: this.xAxis.tpdArray[this.xAxis.tpdIndex],
                bufferSize: this.xAxis.loggerBufferSize,
                channels: []
            };
            // Save chart data for all channels, not just selected?
            for (let i = 0; i < this.daqChans.length; i++) {
                let chanObj = {
                    [(i + 1).toString()]: {
                        vpd: this.loggerPlotService.vpdArray[this.loggerPlotService.vpdIndices[i]],
                        vOffset: this.daqChans[i].vOffset
                    }
                };
                saveObj['chart']['channels'].push(chanObj);
            }
        }
        if (saveDaq) {
            saveObj['daq'] = JSON.parse(JSON.stringify(this.daqParams));
            saveObj['daq'].channels = [];
            this.daqChans.forEach((channel, index) => {
                if (this.selectedChannels[index]) {
                    let chanObj = {
                        [(index + 1).toString()]: {
                            average: channel.average
                        }
                    };
                    saveObj['daq']['channels'].push(chanObj);
                }
            });
        }
        return saveObj;
    }

    private parseAndApplyProfileJson(loadedObj) {
        if (loadedObj.daq !== undefined) {
            this.selectedChannels = this.selectedChannels.map(() => false);
            this.averagingEnabled = false;
        }
        for (let instrument in loadedObj) {
            if (instrument === 'daq') {
                this.daqParams.maxSampleCount = loadedObj[instrument]['maxSampleCount'];
                this.daqParams.sampleFreq = loadedObj[instrument]['sampleFreq'];
                this.daqParams.startDelay = loadedObj[instrument]['startDelay'];
                this.daqParams.storageLocation = loadedObj[instrument]['storageLocation'];
                this.daqParams.uri = loadedObj[instrument]['uri'];

                // set log to location based on storageLocation
                let logTo = loadedObj[instrument]['storageLocation'] === 'ram' ? 'chart' : 'SD';
                this.selectedLogLocation = logTo;
                this.logToChild._applyActiveSelection(logTo);

                // select channels
                loadedObj[instrument].channels.forEach((channel) => {
                    let chanNum = parseInt(Object.keys(channel)[0]);
                    this.selectedChannels[chanNum - 1] = true;
                    this.daqChans[chanNum - 1].average = channel[chanNum].average;

                    if (channel[chanNum].average > 1) {
                        this.averagingEnabled = true;
                    }
                });

                // set mode dropdown
                let selection = loadedObj[instrument].maxSampleCount === -1 ? 'continuous' : 'finite';
                this.modeChild._applyActiveSelection(selection);
            } else if (instrument === 'chart') {
                this.xAxis.valChange(loadedObj[instrument]['tpd']);
                this.xAxis.loggerBufferSize = loadedObj[instrument]['bufferSize'];

                loadedObj[instrument].channels.forEach((channel) => {
                    let chanNum = parseInt(Object.keys(channel)[0]);
                    if (this.loggerPlotService.vpdArray.indexOf(channel[chanNum].vpd) !== -1) {
                        this.loggerPlotService.vpdIndices[chanNum - 1] = this.loggerPlotService.vpdArray.indexOf(channel[chanNum].vpd);
                    }
                    this.daqChans[chanNum - 1].vOffset = channel[chanNum].vOffset;
                });
            }
        }
    }

    private saveProfile(profileName: string, saveChart: boolean, saveDaq: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let objToSave = this.generateProfileJson(saveChart, saveDaq);
            let str = JSON.stringify(objToSave);
            let buf = new ArrayBuffer(str.length);
            let bufView = new Uint8Array(buf);
            for (let i = 0; i < str.length; i++) {
                bufView[i] = str.charCodeAt(i);
            }
            this.activeDevice.file.write('flash', this.settingsService.profileToken + profileName + '.json', buf).subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    private getStorageLocations(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.storageGetLocations().subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    setActiveSeries(axisNum: number) {
        this.loggerPlotService.setActiveSeries(axisNum + 1);
    }

    formatInputAndUpdate(trueValue: number, type: LoggerInputType, channel?: number) {
        console.log(trueValue);
        switch (type) {
            case 'delay':
                this.daqParams.startDelay = trueValue;
                break;
            case 'offset':
                (<DaqChannelParams>this.daqChans[channel]).vOffset = trueValue;
                this.loggerPlotService.setPosition('y', channel + 1, trueValue, true);
                break;
            case 'samples':
                trueValue = trueValue < 1 ? 1 : trueValue;
                this.daqParams.maxSampleCount = trueValue;
                break;
            case 'sampleFreq':
                this.validateAndApply(trueValue, 'sampleFreq');
                break;
            default:
                break;
        }
    }

    stopLogger() {
        if (this.running) {
            this.messageQueue.push(() => this.stop().then(() => this.running = false));
        } else {
            this.stop()
                .then((data) => {
                    console.log(data);
                    this.running = false;
                })
                .catch((e) => {
                    console.log(e);
                });
        }
    }

    private clearChart() {
        for (let i = 0; i < this.dataContainers.length; i++) {
            this.dataContainers[i].data = [];
        }
        this.loggerPlotService.setData(this.dataContainers, this.viewMoved);
        this.dataAvailable = false;
    }

    private parseReadResponseAndDraw(readResponse) {
        let t0 = performance.now();
        for (let instrument in readResponse.instruments) {
            for (let channel in readResponse.instruments[instrument]) {
                let formattedData: number[][] = [];
                let channelObj = readResponse.instruments[instrument][channel];
                let dt = 1 / (channelObj.actualSampleFreq / 1000000);
                let timeVal = channelObj.startIndex * dt;

                let chanIndex: number = parseInt(channel) - 1;
                for (let i = 0; i < channelObj.data.length; i++) {
                    let data = (this.unitTransformer[chanIndex]) ? this.unitTransformer[chanIndex](channelObj.data[i]) :
                        channelObj.data[i];

                    formattedData.push([timeVal, data]);

                    timeVal += dt;
                }

                let dataContainerIndex = 0;

                dataContainerIndex += chanIndex;
                this.dataContainers[dataContainerIndex].seriesOffset = 0;
                this.dataContainers[dataContainerIndex].data = this.dataContainers[dataContainerIndex].data.concat(formattedData);

                let overflow = 0;
                let containerSize = (this.daqParams.sampleFreq) * this.xAxis.loggerBufferSize;
                if ((overflow = this.dataContainers[dataContainerIndex].data.length - containerSize) >= 0) {
                    this.dataContainers[dataContainerIndex].data = this.dataContainers[dataContainerIndex].data.slice(overflow); // older data is closer to the front of the array, so remove it by the overflow amount
                }
            }
        }
        this.setViewToEdge();
        this.loggerPlotService.setData(this.dataContainers, this.viewMoved);
        this.dataAvailable = true;
        let t1 = performance.now();
        console.log('time to parse and draw:', t1 - t0);
    }

    private existingFileFoundAndValidate(loading): { reason: number } {
        let existingFileFound: boolean = false;
        if (this.daqParams.storageLocation !== 'ram' && this.daqParams.uri === '') {
            loading.dismiss();
            this.toastService.createToast('loggerInvalidFileName', true, undefined, 8000);
            return { reason: 1 };
        }
        if (this.loggerState !== 'idle' && this.loggerState !== 'stopped') {
            loading.dismiss();
            this.toastService.createToast('loggerInvalidState', true, undefined, 8000);
            return { reason: 1 };
        }

        if (this.selectedLogLocation === 'chart') {
            return { reason: 0 };
        }

        if (this.filesInStorage[this.daqParams.storageLocation].indexOf(this.daqParams.uri + '.dlog') !== -1) {
            //File already exists on device display alert
            existingFileFound = true;
        } else {
            this.filesInStorage[this.daqParams.storageLocation].push(this.daqParams.uri + '.dlog');
        }
        return (existingFileFound ? { reason: 2 } : { reason: 0 });
    }

    startLogger() {
        if (this.selectedChannels.indexOf(true) === -1) {
            let mode = this.selectedLogLocation === 'chart' ? 'Streaming' : 'Logging';
            this.toastService.createToast('loggerNoChannelsError', true, mode, 5000);
            return;
        }

        let loading = this.loadingService.displayLoading('Starting data logging...');

        this.getCurrentState(this.daqChanNumbers, true)
            .then((data) => {
                console.log(data);
                let returnData: { reason: number } = this.existingFileFoundAndValidate(loading);
                if (returnData.reason === 2) {
                    loading.dismiss();
                    this.fileExists()
                        .then((data) => {
                            let loading = this.loadingService.displayLoading('Starting data logging...');
                            this.setParametersAndRun(loading);
                        })
                        .catch((e) => { });
                }
                else if (returnData.reason === 0) {
                    this.setParametersAndRun(loading);
                }
            })
            .catch((e) => {
                console.log(e);
                loading.dismiss();
                this.toastService.createToast('loggerUnknownRunError', true, undefined, 8000);
            });
    }

    private setParametersAndRun(loading) {
        let daqChanArray = [];
        for (let i = 0; i < this.daqChans.length; i++) {
            this.count = -1000;
            this.startIndex = 0;
            if (this.selectedChannels[i]) {
                daqChanArray.push(i + 1);
            }
        }

        this.clearChart();
        this.setViewToEdge();

        this.setParameters('analog', daqChanArray)
            .then((data) => {
                console.log(data);
                return this.run('analog', daqChanArray);
            })
            .then((data) => {
                if (data.log.daq.statusCode !== 0) {
                    this.toastService.createToast('loggerUnknownRunError', true, undefined, 8000);
                    this.running = false;
                    this.stopLogger();
                    loading.dismiss();
                } else {
                    console.log(data);
                    this.running = true;
                    loading.dismiss();

                    this.daqChansToRead = this.selectedChannels.reduce((chanArray, isSelected, i) => {
                        if (isSelected) {
                            chanArray.push(i + 1);
                        }
                        return chanArray;
                    }, []);

                    if (this.selectedLogLocation === 'SD' && !this.logAndStream) {
                        this.getLiveState();
                    } else {
                        this.readLiveData();
                    }
                }
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('loggerUnknownRunError', true, undefined, 8000);
                this.running = false;
                this.stopLogger();
                loading.dismiss();
            });
    }

    private getLiveState() {
        this.getCurrentState(this.daqChansToRead.slice())
            .then((data) => {
                this.parseGetLiveStatePacket('analog', data);
                if (this.running) {
                    setTimeout(() => {
                        if (this.selectedLogLocation === 'SD' && this.logAndStream) {
                            this.continueStream();
                        }
                        else {
                            this.getLiveState();
                        }
                    }, 1000);
                }
            })
            .catch((e) => {
                if (this.running) {
                    setTimeout(() => {
                        this.getLiveState();
                    }, 1000);
                }
            });
    }

    private parseGetLiveStatePacket(instrument: 'digital' | 'analog', data) {
        for (let channel in data.log[instrument]) {
            if (data.log[instrument][channel][0].stopReason === 'OVERFLOW') {
                console.log('OVERFLOW');
                this.toastService.createToast('loggerStorageCouldNotKeepUp', true, undefined, 8000);
                // Set running to false beforehand so that another getCurrentState does not occur
                this.running = false;
                this.stopLogger();
            }
            else if (data.log[instrument][channel][0].state === 'stopped') {
                if (instrument === 'analog') {
                    this.daqChansToRead.splice(this.daqChansToRead.indexOf(parseInt(channel)), 1);
                }
                if (this.daqChansToRead.length < 1) {
                    this.toastService.createToast('loggerLogDone');
                    this.running = false;
                }
            }
        }
    }

    private readLiveData() {
        // if the messageQueue has something in it, run that instead, then pop it off the queue. Call readLiveData again (if running?).
        let message;
        if ((message = this.messageQueue.shift()) !== undefined) {
            message().then(() => {
                console.warn('STARTING AGAIN');
                this.readLiveData(); // try to read again
            });

            return;
        }

        if (this.destroyed) return; // if we are leaving, don't do another read

        //Make copies of analogChansToRead so mid-read changes to analogChansToRead don't change the channel array
        this.read('daq', this.daqChansToRead.slice())
            .then((data) => {
                this.parseReadResponseAndDraw(data);
                if (this.running) {
                    if (this.selectedLogLocation === 'SD' && !this.logAndStream) {
                        this.getLiveState();
                    } else {
                        if (this.activeDevice.transport.getType() === 'local') {
                            requestAnimationFrame(() => { // note: calling readLiveData without some delay while simulating freezes the UI, so we request the browser keep time for us.
                                this.readLiveData();
                            });
                        } else {
                            this.readLiveData();
                        }
                    }
                }
                else {
                    this.viewMoved = false;
                }
            })
            .catch((e) => {
                console.log('error reading live data');
                console.log(e);
                if (this.destroyed) { return; }
                else if (e === 'corrupt transfer') {
                    this.readLiveData();
                    return;
                }
                else if (e.message && e.message === 'Data not ready' && this.running) {
                    console.log('data not ready');
                    this.readLiveData();
                    return;
                }
                else if (e.message && e.message === 'Could not keep up with device') {
                    this.toastService.createToast('loggerCouldNotKeepUp', false, undefined, 10000);
                    this.stop()
                        .then((data) => {
                            console.log(data);
                        })
                        .catch((e) => {
                            console.log(e);
                        });
                }
                else {
                    this.toastService.createToast('loggerUnknownRunError', true, undefined, 8000);
                }
                this.getCurrentState(this.daqChanNumbers)
                    .then((data) => {
                        console.log(data);
                        this.stopLogger();
                    })
                    .catch((e) => {
                        console.log(e);
                        this.stopLogger();
                    });
            });
    }

    toggleLoggerSettings() {
        this.showLoggerSettings = !this.showLoggerSettings;
    }

    toggleAdvSettings() {
        this.showAdvSettings = !this.showAdvSettings;
    }

    exportCanvasAsPng() {
        let flotOverlayRef = document.getElementById('loggerChart').childNodes[1];
        this.exportService.exportCanvasAsPng(this.loggerPlotService.chart.getCanvas(), flotOverlayRef);
    }

    exportCsv(fileName: string) {
        let analogChanArray = [];
        for (let i = 0; i < this.daqChans.length; i++) {
            analogChanArray.push(i);
        }
        this.exportService.exportGenericCsv(fileName, this.dataContainers, analogChanArray, [{
            instrument: 'Analog',
            seriesNumberOffset: 0,
            xUnit: 's',
            yUnit: 'V',
            channels: analogChanArray
        }]);
    }

    private applyCurrentStateResponse(data: any, onlyCopyState: boolean = false) {
        for (let instrument in data.log) {
            if (instrument === 'daq') {
                let stateData = data.log[instrument];
                if (stateData.statusCode == undefined) { return; }
                this.loggerState = stateData.state.trim();
                if (stateData.state === 'running') {
                    this.running = true;
                }
                if (onlyCopyState) {
                    return;
                }

                if (stateData.maxSampleCount != undefined) {
                    this.daqParams.maxSampleCount = stateData.maxSampleCount;
                    // set mode dropdown
                    this.selectedMode = stateData.maxSampleCount === -1 ? 'continuous' : 'finite';
                    this.modeChild._applyActiveSelection(this.selectedMode);
                }
                if (stateData.actualSampleFreq != undefined) {
                    this.daqParams.sampleFreq = stateData.actualSampleFreq / 1000000;
                }
                if (stateData.actualStartDelay != undefined) {
                    this.daqParams.startDelay = stateData.actualStartDelay / Math.pow(10, 12);
                }
                if (stateData.uri != undefined) {
                    if (stateData.uri.indexOf('.dlog') !== -1) {
                        // Remove .dlog from end of file
                        stateData.uri = stateData.uri.slice(0, stateData.uri.indexOf('.dlog'));
                    }
                    this.daqParams.uri = stateData.uri;
                }

                if (this.storageLocations.length <= 1) {
                    stateData.storageLocation = 'ram';
                }
                this.daqParams.storageLocation = stateData.storageLocation;
                if (stateData.storageLocation === 'ram') {
                    this.selectedLogLocation = 'chart';
                    this.logToChild._applyActiveSelection('chart');
                } else {
                    this.selectedLogLocation = 'SD';
                    this.logToChild._applyActiveSelection('SD');
                }

                this.selectedChannels = this.selectedChannels.map(() => false);
                this.averagingEnabled = false;
                if (stateData.channels != undefined && stateData.channels.length > 0) {
                    stateData.channels.forEach((channel) => {
                        let key = Object.keys(channel)[0];
                        let index = parseInt(key) - 1;

                        // select channel
                        this.selectedChannels[index] = true;

                        this.daqChans[index].average = channel[key].average;
                        if (channel[key].average > 1) {
                            this.averagingEnabled = true;
                        }
                    });
                } else {
                    // select channel 1 by default
                    this.selectedChannels[0] = true;
                }

                if (stateData.actualCount != undefined && stateData.actualCount > 0) {
                    this.startIndex = stateData.actualCount;
                }
            }
        }
    }

    logAndStreamChange() {
        if (this.logAndStream) {
            this.bothStartStream();
        }
    }

    bothStartStream() {
        this.clearChart();
        this.viewMoved = false;
        this.setViewToEdge();
    }

    setParameters(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let observable;
            if (instrument === 'analog') {
                if (this.daqChans.length < 1) {
                    resolve();
                    return;
                }

                let averages = chans.map((chan) => this.daqChans[chan - 1].average);
                let overflows = Array.apply(null, Array(chans.length)).map(() => 'circular');

                observable = this.activeDevice.instruments.logger.daq.setParameters(
                    chans,
                    this.daqParams.maxSampleCount,
                    this.daqParams.sampleFreq,
                    this.daqParams.startDelay,
                    this.daqParams.storageLocation,
                    this.daqParams.uri,
                    averages,
                    overflows
                );
            }
            observable.subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    run(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.daqChans.length < 1) {
                resolve();
                return;
            }

            this.activeDevice.instruments.logger.daq.run(instrument, chans).subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    stop(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.daqChans.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.daq.stop().subscribe(
                (data) => {
                    console.log(data);
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    read(instrument: 'analog' | 'digital' | 'daq', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {

            if (this.daqChansToRead.length < 1 || this.daqChans.length < 1) {
                resolve();
                return;
            }

            let finalObj = {};
            
            this.activeDevice.instruments.logger.daq.read(instrument, chans, this.startIndex, this.count)
                .subscribe(
                    ({cmdRespObj, instruments}) => {
                        let data = {cmdRespObj, instruments};
                        
                        if (this.startIndex >= 0 && this.startIndex !== cmdRespObj.log.daq.startIndex) {
                            reject({
                                message: 'Could not keep up with device',
                                data: data
                            });
                            return;
                        }

                        this.updateValuesFromRead(data, instrument, chans, chans.length - 1);

                        this.deepMergeObj(finalObj, data);

                        resolve(finalObj);
                    },
                    (err) => {
                        console.log(err);
                        if (err.payload != undefined) {
                            let jsonString = String.fromCharCode.apply(null, new Uint8Array(err.payload));
                            let parsedData;
                            try {
                                parsedData = JSON.parse(jsonString);
                            }
                            catch (e) {
                                reject(e);
                                return;
                            }
                            //Check if data is not ready
                            if (parsedData && parsedData.log && parsedData.log[instrument]) {
                                if (parsedData.log[instrument].statusCode === 2684354593) {
                                    console.log('data not ready');
                                    reject({
                                        message: 'Data not ready',
                                        data: parsedData
                                    });
                                    return;
                                }
                                else if (parsedData.log[instrument].statusCode === 2684354595) {
                                    reject({
                                        message: 'Could not keep up with device',
                                        data: parsedData
                                    })
                                }
                            }
                        }
                        reject(err);
                    },
                    () => { }
                );
        });
    }

    private updateValuesFromRead(data, instrument: 'analog' | 'digital' | 'daq', chans: number[], index: number) {
        if (data != undefined && data.instruments != undefined && data.instruments[instrument] != undefined && data.instruments[instrument][chans[index]].statusCode === 0) {
            if (instrument === 'daq') {
                // update the start index w/ what the device gives us
                this.startIndex = data.cmdRespObj.log.daq.startIndex;

                // increment startIndex by the actual count given
                this.startIndex += data.cmdRespObj.log.daq.actualCount; 

                // reset count. A negative value tells the OpenLogger to give everything it currently has
                this.count = -1000;

                // if the start index is greater than maxSample count
                if (this.daqParams.maxSampleCount > 0 && this.startIndex >= this.daqParams.maxSampleCount) {

                    // splice the channels to read list, removing everything after the bad index...
                    this.daqChansToRead.splice(this.daqChansToRead.indexOf(chans[index]), 1);

                    if (this.daqChansToRead.length < 1) {
                        this.running = false;
                    }
                }
            }
        }
    }

    private deepMergeObj(destObj, sourceObj) {
        if (this.isObject(destObj) && this.isObject(sourceObj)) {

            Object.keys(sourceObj).forEach((key) => {
                if (sourceObj[key].constructor === Array) {
                    destObj[key] = [];

                    sourceObj[key].forEach((el, index, arr) => {
                        if (this.isObject(el)) {
                            if (destObj[key][index] == undefined) {
                                destObj[key][index] = {};
                            }

                            this.deepMergeObj(destObj[key][index], sourceObj[key][index]);
                        }
                        else {
                            destObj[key][index] = sourceObj[key][index];
                        }
                    });
                }
                else if (this.isObject(sourceObj[key])) {
                    if (destObj[key] == undefined) {
                        destObj[key] = {};
                    }

                    this.deepMergeObj(destObj[key], sourceObj[key]);
                }
                else {
                    destObj[key] = sourceObj[key];
                }
            });
        }
    }

    private isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    listDir(location: string, path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.listDir(location, path).subscribe(
                (data) => {
                    this.filesInStorage[location] = data.file[0].files;
                    console.log(this.filesInStorage);
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    getCurrentState(chans: number[], onlyCopyState: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.daqChans.length < 1 || chans.length < 1) {
                resolve();
                return;
            }

            this.activeDevice.instruments.logger.daq.getCurrentState('daq', chans).subscribe(
                (data) => {
                    if (data.log != undefined && data.log.daq != undefined) {
                        this.applyCurrentStateResponse(data, onlyCopyState);
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    decrementAverage(chanIndex) {
        if (this.daqChans[chanIndex].average > 1) {
            this.daqChans[chanIndex].average /= 2;
        }
    }

    incrementAverage(chanIndex) {
        if (this.daqChans[chanIndex].average < this.maxAverage) {
            this.daqChans[chanIndex].average *= 2;
        }
    }

    toggleAveraging(event) {
        if (!event.checked) {
            this.daqChans.forEach((chan) => {
                chan.average = 1;
            });
        }
    }
}

export interface LoggerParams {
    maxSampleCount: number,
    sampleFreq: number,
    startDelay: number,
    overflow: 'stop' | 'circular',
    storageLocation: string,
    uri: string,
    startIndex: number,
    count: number,
    state: LoggerChannelState
}

export type LoggerChannelState = 'busy' | 'idle' | 'stopped' | 'running';

export interface AnalogLoggerParams extends LoggerParams {
    gain: number,
    vOffset: number
}

export type LoggerInputType = 'delay' | 'offset' | 'samples' | 'sampleFreq';

export interface DaqChannelParams {
    average: number,
    vOffset: number
}

export interface DaqLoggerParams {
    maxSampleCount: number,
    startDelay: number,
    sampleFreq: number,
    storageLocation: string,
    uri: string,
}
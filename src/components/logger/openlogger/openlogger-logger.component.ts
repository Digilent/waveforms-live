import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { AlertController, PopoverController, Events } from 'ionic-angular';
import { LoadingService } from '../../../services/loading/loading.service';
import { ToastService } from '../../../services/toast/toast.service';
import { Observable } from 'rxjs/Observable';
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

    private activeDevice: DeviceService;
    public showLoggerSettings: boolean = true;
    public showAdvSettings: boolean = false;
    public selectedChannels: boolean[] = [];

    private daqParams: DaqLoggerParams = {
        maxSampleCount: -1,
        startDelay: 0,
        sampleFreq: 1000,
        state: 'idle'
    };
    private defaultDaqChannelParams: DaqChannelParams = {
        average: 1,
        storageLocation: 'ram',
        uri: '',
        vOffset: 0
    };
    public daqChans: DaqChannelParams[] = [];

    public average: number = 1;
    public maxAverage: number = 256;

    public startIndex: number = 0;
    public count: number = 0;

    private daqChanNumbers: number[] = [];
    public logToLocations: string[] = ['chart', 'SD', 'both'];
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

        this.events.subscribe('profile:save', (params) => {
            this.saveAndSetProfile(params[0]['profileName']);
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
    }

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
            let current = this.generateProfileJson();
            this.dirtyProfile = JSON.stringify(current) !== JSON.stringify(this.profileObjectMap[this.selectedLogProfile]);
        }
    }

    ngOnDestroy() {
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
                    return this.loadProfilesFromDevice();
                })
                .then((data) => {
                    console.log(data);
                    return this.getCurrentState(daqChanArray);
                })
                .catch((e) => {
                    console.log(e);
                    // TODO: uncomment when getStorageLocations command is implemented
                    // if (this.storageLocations.length < 1) {
                    //     this.logToLocations = ['chart'];
                    //     this.logToSelect('chart');
                    // }
                    return this.getCurrentState(daqChanArray);
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
        let popover = this.popoverCtrl.create(ChannelSelectPopover, { selectedChannels: this.selectedChannels }, {
            cssClass: 'logChannelsPopover'
        });
        popover.present({
            ev: event
        });
    }

    private scaleSelect(event: string, channel: number) {
        let currentScale = this.selectedScales[channel];
        this.selectedScales[channel] = event;
        if (event === 'None') {
            // remove scaling on this channel and reset units
            this.unitTransformer[channel] = undefined;
            this.events.publish('units:update', { channel: channel });
        } else {
            // apply expression to this channel and update units
            this.scalingService.getScalingOption(event)
                .then((result) => {
                    // apply scaling to this channel
                    this.unitTransformer[channel] = result.expression;
                    this.events.publish('units:update', { channel: channel, units: result.unitDescriptor });
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
        this.daqChansToRead = [];
        for (let i = 0; i < this.daqChans.length; i++) {
            if (this.daqParams.state === 'running') { // if currently running & the channel is active, then push it(?)
                this.daqChansToRead.push(i + 1);
                this.count = -1000;
                this.startIndex = -1;
            }
        }

        if (this.selectedLogLocation === 'SD') {
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

    private validateAndApply(newVal: number, type: 'sampleFreq' | 'samples') {
        if (type === 'sampleFreq') {
            // TODO: get minFreq and maxFreq from instrument before setting

            // let chanObj = this.activeDevice.instruments.logger[instrument].chans[axisNum];
            // let minFreq = chanObj.sampleFreqMin * chanObj.sampleFreqUnits;
            // let maxFreq = chanObj.sampleFreqMax * chanObj.sampleFreqUnits;
            // if (newVal < minFreq) {
            //     newVal = minFreq;
            // }
            // else if (newVal > maxFreq) {
            //     newVal = maxFreq;
            // }
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
        if (this.dataContainers[0].data[0] == undefined || this.dataContainers[0].data[0][0] == undefined) {
            //Data was cleared
            this.loggerPlotService.setPosition('x', 1, this.loggerPlotService.xAxis.base * 5, true);
            return;
        }

        let rightPos = this.dataContainers[0].data[this.dataContainers[0].data.length - 1][0];
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
            this.daqChans.forEach((channel, index) => {
                channel.storageLocation = this.storageLocations[0];
            });
        }
        if (event === 'chart') {
            this.daqChans.forEach((channel, index) => {
                channel.storageLocation = 'ram';
            });
        }
        this.selectedLogLocation = event;
    }

    updateUri(event) {
        let uri = event.target.value;
        console.log(uri);
        this.daqChans.forEach((channel, index) => {
            channel.uri = uri;
        });
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
        let popover = this.popoverCtrl.create(ProfilePopover, { profileName: name }, {
            cssClass: 'profilePopover'
        });
        popover.present({
            ev: event
        });
    }

    private profileSaveClick(name, event) {
        // if new profile open popover, otherwise just save
        if (name === 'New Profile') {
            this.openProfileSettings('', event);
        } else {
            this.saveAndSetProfile(name);
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

    saveAndSetProfile(profileName) {
        console.log(profileName);
        this.saveProfile(profileName)
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
        let profileObj = this.generateProfileJson();
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

    private generateProfileJson() {
        let saveObj = {};
        if (this.daqChans.length > 0) {
            saveObj['daq'] = JSON.parse(JSON.stringify(this.daqParams));
            saveObj['daq'].channels = [];
        }
        this.daqChans.forEach((channel, index) => {
            if (this.selectedChannels[index]) {
                let chanObj = {
                    [(index + 1).toString()]: {
                        average: channel.average,
                        storageLocation: channel.storageLocation,
                        uri: channel.uri
                    }
                };
                saveObj['daq']['channels'].push(chanObj);
            }
        });
        return saveObj;
    }

    private parseAndApplyProfileJson(loadedObj) {
        this.selectedChannels = this.selectedChannels.map(() => false);
        for (let instrument in loadedObj) {
            if (instrument === 'daq') {
                this.daqParams.maxSampleCount = loadedObj[instrument]['maxSampleCount'];
                this.daqParams.sampleFreq = loadedObj[instrument]['sampleFreq'];
                this.daqParams.startDelay = loadedObj[instrument]['startDelay'];

                // select channels
                loadedObj[instrument].channels.forEach((channel) => {
                    let chanNum = parseInt(Object.keys(channel)[0]);
                    this.selectedChannels[chanNum - 1] = true;
                    this.daqChans[chanNum - 1] = channel[chanNum];

                    // set log to location based on storageLocation
                    let logTo = channel[chanNum].storageLocation === 'ram' ? 'chart' : 'SD';
                    this.selectedLogLocation = logTo;
                    this.logToChild._applyActiveSelection(logTo);
                });

                // set mode dropdown
                let selection = loadedObj[instrument].maxSampleCount === -1 ? 'continuous' : 'finite';
                this.modeChild._applyActiveSelection(selection);
            }
        }
    }

    private saveProfile(profileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let objToSave = this.generateProfileJson();
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
        this.stop('daq', this.daqChanNumbers)
            .then((data) => {
                console.log(data);
                this.running = false;
            })
            .catch((e) => {
                console.log(e);
            });
    }

    private clearChart() {
        for (let i = 0; i < this.dataContainers.length; i++) {
            this.dataContainers[i].data = [];
        }
        this.loggerPlotService.setData(this.dataContainers, false);
        this.dataAvailable = false;
    }

    private parseReadResponseAndDraw(readResponse) {
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
                this.dataContainers[dataContainerIndex].seriesOffset = channelObj.actualVOffset / 1000;
                this.dataContainers[dataContainerIndex].data = this.dataContainers[dataContainerIndex].data.concat(formattedData);

                let overflow = 0;
                let numChans = this.selectedChannels.lastIndexOf(true) + 1;
                let containerSize = (this.daqParams.sampleFreq / numChans)* this.xAxis.loggerBufferSize;
                if ((overflow = this.dataContainers[dataContainerIndex].data.length - containerSize) >= 0) {
                    this.dataContainers[dataContainerIndex].data = this.dataContainers[dataContainerIndex].data.slice(overflow); // older data is closer to the front of the array, so remove it by the overflow amount
                }
            }
        }
        this.setViewToEdge();
        this.loggerPlotService.setData(this.dataContainers, false);
        this.dataAvailable = true;
    }

    private existingFileFoundAndValidate(loading): { reason: number } {
        let existingFileFound: boolean = false;
        let foundChansMap = {};
        for (let i = 0; i < this.daqChans.length; i++) {
            if (this.daqChans[i].storageLocation !== 'ram' && this.daqChans[i].uri === '') {
                loading.dismiss();
                this.toastService.createToast('loggerInvalidFileName', true, undefined, 8000);
                return { reason: 1 };
            }
            if (this.daqParams.state !== 'idle' && this.daqParams.state !== 'stopped') {
                loading.dismiss();
                this.toastService.createToast('loggerInvalidState', true, undefined, 8000);
                return { reason: 1 };
            }

            if (foundChansMap[this.daqChans[i].uri] != undefined) {
                loading.dismiss();
                this.toastService.createToast('loggerMatchingFileNames', true, undefined, 8000);
                return { reason: 1 };
            }


            if (this.daqChans[i].storageLocation !== 'ram') {
                foundChansMap[this.daqChans[i].uri] = 1;
            }
            if (this.selectedLogLocation === 'chart') { continue; }
            if (this.filesInStorage[this.daqChans[i].storageLocation].indexOf(this.daqChans[i].uri + '.dlog') !== -1) {
                //File already exists on device display alert
                existingFileFound = true;
            }
            else {
                //TODO fix this so that new uris are only pushed after all channels are processed. Could create a new obj and then deep merge
                this.filesInStorage[this.daqChans[i].storageLocation].push(this.daqChans[i].uri + '.dlog');
            }
        }
        return (existingFileFound ? { reason: 2 } : { reason: 0 });
    }

    startLogger() {
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
                    //TODO load this value from the selected chans assuming individual channel selection is an added feature later
                    this.daqChansToRead = this.selectedChannels.filter(isSelected => isSelected === true)
                                                .map((_, index) => index + 1);
                    if (this.selectedLogLocation !== 'SD') {
                        this.readLiveData();
                    }
                    else {
                        this.getLiveState();
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
                        if (this.selectedLogLocation === 'both') {
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
        //Make copies of analogChansToRead so mid-read changes to analogChansToRead don't change the channel array
        this.read('daq', this.daqChansToRead.slice())
            .then((data) => {
                this.parseReadResponseAndDraw(data);
                if (this.running) {
                    if (this.selectedLogLocation !== 'SD') {
                        if (this.activeDevice.transport.getType() === 'local') {
                            requestAnimationFrame(() => { // note: calling readLiveData without some delay while simulating freezes the UI, so we request the browser keep time for us.
                                    this.readLiveData();
                            });
                        } else {
                            this.readLiveData();
                        }
                    }
                    else {
                        this.getLiveState();
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
                    this.stop('daq', this.daqChansToRead)
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
                    })
                    .catch((e) => {
                        console.log(e);
                    });
                this.running = false;
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
                    this.daqParams.sampleFreq = stateData.actualSampleFreq;
                }
                if (stateData.actualStartDelay != undefined) {
                    this.daqParams.startDelay = stateData.actualStartDelay / Math.pow(10, 12);
                }

                this.selectedChannels = this.selectedChannels.map(() => false);
                if (stateData.channels != undefined && stateData.channels.length > 0) {
                    stateData.channels.forEach((channel) => {
                        let key = Object.keys(channel)[0];
                        let index = parseInt(key) - 1;
                        
                        // select channel
                        this.selectedChannels[index] = true;

                        this.copyChannelState(channel[key], index);
                    });
                } else {
                    // select channel 1 by default
                    this.selectedChannels[0] = true;
                }
            }
        }
    }

    bothStopStream() {
        this.selectedLogLocation = 'SD';
        this.logToChild._applyActiveSelection('SD');
    }

    bothStartStream() {
        this.clearChart();
        this.viewMoved = false;
        this.setViewToEdge();
        this.selectedLogLocation = 'both';
        this.logToChild._applyActiveSelection('both');
    }

    private copyChannelState(respObj, channelInternalIndex: number) {
        let activeChan = this.daqChans[channelInternalIndex];
        
        if (this.storageLocations.length < 1) {
            respObj.storageLocation = 'ram';
        }
        activeChan.storageLocation = respObj.storageLocation;
        if (respObj.storageLocation === 'ram') {
            this.selectedLogLocation = 'chart';
            this.logToChild._applyActiveSelection('chart');
        } else {
            this.selectedLogLocation = 'SD';
            this.logToChild._applyActiveSelection('SD');
        }

        activeChan.average = respObj.average;
        this.average = respObj.average;

        if (respObj.uri) {
            if (respObj.uri.indexOf('.dlog') !== -1) {
                // Remove .dlog from end of file
                respObj.uri = respObj.uri.slice(0, respObj.uri.indexOf('.dlog'));
            }
            activeChan.uri = respObj.uri;
        }
    }

    setParameters(instrument: 'analog' | 'digital', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let observable;
            if (instrument === 'analog') {
                if (this.daqChans.length < 1) {
                    resolve();
                    return;
                }

                let overflows = [];
                let storageLocations = [];
                let uris = [];
                chans.forEach((chan) => {
                    overflows.push('circular');
                    storageLocations.push(this.daqChans[chan - 1].storageLocation);
                    uris.push(this.daqChans[chan - 1].uri + '.dlog');
                });

                observable = this.activeDevice.instruments.logger.daq.setParameters(
                    chans,
                    this.daqParams.maxSampleCount,
                    this.daqParams.sampleFreq,
                    this.daqParams.startDelay,
                    this.average,
                    overflows,
                    storageLocations,
                    uris
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

    stop(instrument: 'analog' | 'digital' | 'daq', chans: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.daqChans.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.daq.stop(instrument, chans).subscribe(
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
            let startIndices: number[] = [];
            let counts: number[] = [];

            if (this.daqChansToRead.length < 1 || this.daqChans.length < 1) {
                resolve();
                return;
            }

            for (let i = 0; i < this.daqChansToRead.length; i++) {
                startIndices.push(this.startIndex);
                counts.push(this.count);
            }

            let finalObj = {};

            chans.reduce((accumulator, currentVal, currentIndex) => {
                return accumulator.flatMap((data) => {
                    if (currentIndex > 0) {
                        let chanObj = this.daqChans[currentIndex - 1];
                        
                        if (this.startIndex >= 0 && this.startIndex !== data.instruments[instrument][currentIndex].startIndex) {
                            return Observable.create((observer) => {
                                observer.error({
                                    message: 'Could not keep up with device',
                                    data: data
                                });
                            });
                        }

                        this.updateValuesFromRead(data, instrument, chans, currentIndex - 1);
                    }

                    this.deepMergeObj(finalObj, data);

                    return this.activeDevice.instruments.logger.daq.read(instrument, [chans[currentIndex]], [startIndices[currentIndex]], [counts[currentIndex]]);
                });
            }, Observable.create((observer) => { observer.next({}); observer.complete(); }))
                .subscribe(
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
                                for (let chan in parsedData.log[instrument]) {
                                    if (parsedData.log[instrument][chan][0].statusCode === 2684354593) {
                                        console.log('data not ready');
                                        reject({
                                            message: 'Data not ready',
                                            data: parsedData
                                        });
                                        return;
                                    }
                                    else if (parsedData.log[instrument][chan][0].statusCode === 2684354595) {
                                        reject({
                                            message: 'Could not keep up with device',
                                            data: parsedData
                                        })
                                    }
                                }
                            }
                        }
                        reject(err);
                    },
                    () => { }
                );
        });
    }

    private updateValuesFromRead(data, instrument: 'analog' | 'digital', chans: number[], index: number) {
        if (data != undefined && data.instruments != undefined && data.instruments[instrument] != undefined && data.instruments[instrument][chans[index]].statusCode === 0) {
            if (instrument === 'daq') {
                this.startIndex = data.cmdRespObj.log.daq.startIndex;
                this.startIndex += data.cmdRespObj.log.daq.actualCount + 1; 
                this.count = -1000;
                if (this.daqParams.maxSampleCount > 0 && this.startIndex >= this.daqParams.maxSampleCount) {
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

    decrementAverage() {
        if (this.average > 1) {
            this.average /= 2;
        }
        this.setChannelAverages();
    }

    incrementAverage() {
        if (this.average < this.maxAverage) {
            this.average *= 2;
        }
        this.setChannelAverages();
    }

    setChannelAverages() {
        this.daqChans.forEach((channel, index) => {
            channel.average = this.average;
        });
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
    storageLocation: string,
    uri: string,
    vOffset: number
}

export interface DaqLoggerParams {
    maxSampleCount: number,
    startDelay: number,
    sampleFreq: number
}
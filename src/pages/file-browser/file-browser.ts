import { Component, ElementRef } from '@angular/core';
import { ViewController, PopoverController, AlertController } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';
import { ExportService } from '../../services/export/export.service';
import { LoadingService } from '../../services/loading/loading.service';
import { SettingsService } from '../../services/settings/settings.service';

//Pipes
import { UnitFormatPipe } from '../../pipes/unit-format.pipe';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Interfaces
import { DataContainer } from 'digilent-chart-angular2/modules';

@Component({
    templateUrl: 'file-browser.html',
    selector: 'file-browser'
})
export class FileBrowserPage {
    private activeDevice: DeviceService;
    public storageLocations: string[] = [];
    public showFolder: any = {};
    public files: any = {};
    private fileSampleRate: number;
    private assumedTransferRate: number = 100000; //100 kBytes per second
    private maxFileSize: number = 10000000; // 10MB
    private stopReason: number = 0;
    private stopReasonArray = ['Log Completed Normally', 'Log Forced', 'Log Error', 'Log Overflow', 'Log Unknown Error'];
    private unitFormatPipe: UnitFormatPipe;
    private showTheAlmightyJasper: boolean = false;
    private jasperCoords: { x: number, y: number } = { x: 0, y: 0 };
    public jasperTop: string = '80px';
    public jasperLeft: string = '80px';


    constructor(
        private deviceManagerService: DeviceManagerService,
        private viewCtrl: ViewController,
        private popoverCtrl: PopoverController,
        private toastService: ToastService,
        private exportService: ExportService,
        private alertCtrl: AlertController,
        private loadingService: LoadingService,
        private settingsService: SettingsService,
        private elementRef: ElementRef
    ) {
        this.unitFormatPipe = new UnitFormatPipe();
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
        this.init();
    }

    init() {
        this.getStorageLocations()
            .then((data) => {
                console.log(data);
                this.storageLocations = data.device[0].storageLocations;
                for (let storageLocation of this.storageLocations) {
                    this.showFolder[storageLocation] = {};
                    this.showFolder[storageLocation]['show'] = false;
                }
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('deviceStorageError', true, undefined, 8000);
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

    private listFiles(location: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.listDir(location, '/').subscribe(
                (data) => {
                    resolve(data);
                },
                (err) => {
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
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    private deleteFile(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.delete(storageLocation, file).subscribe(
                (data) => {
                    console.log(data);
                    let index = this.showFolder[storageLocation].files.indexOf(file);
                    if (index !== -1) {
                        this.showFolder[storageLocation].files.splice(index, 1);
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    this.toastService.createToast('fileDeleteErr', true, undefined, 5000);
                    reject(err);
                    //TODO remove when Keith fixes syntax err
                    let index = this.showFolder[storageLocation].files.indexOf(file);
                    if (index !== -1) {
                        this.showFolder[storageLocation].files.splice(index, 1);
                    }
                },
                () => { }
            );
        });
    }

    private readFile(storageLocation: string, file: string, filePosition: number = 0, length: number = -1, timeoutOverride?: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.read(storageLocation, file, filePosition, length, timeoutOverride).subscribe(
                (data) => {
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    private downloadFile(storageLocation: string, file: string) {
        let loading;
        this.checkFileAndConfirm(storageLocation, file)
            .then((data) => {
                loading = this.loadingService.displayLoading('Downloading file...');
                return this.readFile(storageLocation, file, 0, -1, 600000);
            })
            .then((data) => {
                console.log(data);
                let fileString = data.file;
                let fileArrBuff: ArrayBuffer = this.createArrayBufferFromString(fileString);
                this.exportService.exportBinary(file, fileArrBuff, 500, false);
                loading.dismiss();
            })
            .catch((e) => {
                console.log(e);
                if (loading != undefined) loading.dismiss();
                if (e === 'cancel') { return; }
                this.toastService.createToast('fileReadErr', true, undefined, 5000);
            });
    }

    private createArrayBufferFromString(source: string): ArrayBuffer {
        let arrayBuffer = new ArrayBuffer(source.length);
        let bufView = new Uint8Array(arrayBuffer);
        for (var i = 0; i < source.length; i < i++) {
            bufView[i] = source.charCodeAt(i);
        }
        return arrayBuffer;
    }

    private getFileSize(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.getFileSize(storageLocation, file).subscribe(
                (data) => {
                    resolve(data);
                },
                (err) => {
                    reject(err);
                },
                () => { }
            );
        });
    }

    private displayBigFileWarning(fileSize: number, location: 'local' | 'remote'): Promise<any> {
        return new Promise((resolve, reject) => {
            let estimatedTime = fileSize / this.assumedTransferRate;
            let buttons = [{
                text: 'Cancel',
                handler: (data) => {
                    reject();
                }
            }];
            if (fileSize < this.maxFileSize) {
                buttons.push({
                    text: 'Continue',
                    handler: (data) => {
                        resolve(data);
                    }
                });
            }
            let errMessage = location === 'local' ?
                'Converting files larger than 10MB is not supported. <br><br>File size: ' + this.unitFormatPipe.transform(fileSize, 'B') + '.<br><br>'
                : 'Transferring files larger than 10MB is not supported. <br><br>File size: ' + this.unitFormatPipe.transform(fileSize, 'B') + '.<br><br>';
            let link = location === 'local' ? 
                'https://reference.digilentinc.com/reference/software/waveforms-live/how-to-convert-dlog' 
                : 'https://reference.digilentinc.com/reference/software/waveforms-live/how-to-retrieve-dlog';
            let message = fileSize < this.maxFileSize ? 
                'The specified log file is expected to take ' + estimatedTime.toFixed(0) + ' seconds to transfer. Communication with the instrument will not be possible during the transfer.'
                : errMessage + ' <a href="' + link + '" target="_blank">More info</a>';
            this.alertWrapper('Warning', message, buttons);
        });
    }

    private checkFileAndConfirm(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getFileSize(storageLocation, file)
                .then((data) => {
                    //file size success
                    console.log(data);
                    if (data.file[0].actualFileSize >= 1000000) {
                        return this.displayBigFileWarning(data.file[0].actualFileSize, 'remote');
                    }
                    else {
                        return Promise.resolve();
                    }
                })
                .catch((e) => {
                    //Get file size error
                    reject('cancel');
                })
                .then((data) => {
                    resolve();
                })
                .catch((e) => {
                    reject('cancel');
                });
        });
    }

    getFiles(storageLocation: string) {
        if (this.showFolder[storageLocation].files != undefined) { return; }
        this.listFiles(storageLocation)
            .then((data) => {
                console.log(data);
                this.showFolder[storageLocation]['files'] = data.file[0].files;
                if (storageLocation === 'flash') {
                    this.showFolder[storageLocation]['files'] = this.showFolder[storageLocation]['files'].filter((item) => {
                        return item.indexOf(this.settingsService.profileToken) !== -1;
                    });
                }
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('fileReadErr', true, undefined, 5000);
            });
    }

    toggleFolder(storageLocation: string) {
        this.showFolder[storageLocation].show = !this.showFolder[storageLocation].show;
        if (this.showFolder[storageLocation].show) {
            this.getFiles(storageLocation);
        }
    }

    openFileInput() {
        document.getElementById('fileBrowserSelect').click();
    }

    fileChange(event) {
        if (event.target.files.length === 0) { return; }
        let fileName = event.target.files[0].name;
        let fileSize = event.target.files[0].size;
        if (fileSize >= this.maxFileSize) {
            this.displayBigFileWarning(fileSize, 'local').catch((e) => {});
            return;
        }
        let fileReader = new FileReader();
        fileReader.onerror = ((e) => {
            console.log('error');
            console.log(e);
        });
        fileReader.onload = ((file: any) => {
            console.log(file);
            let arrBuffFile = file.target.result;
            this.verifyLocalLogFile(arrBuffFile, fileSize, fileName);

        });
        console.log(event.target.files[0]);
        fileReader.readAsArrayBuffer(event.target.files[0]);
    }

    selectFile(event, file: string, storageLocation: string) {
        let dataArray = ['Download', 'Delete'];
        let splitArray = file.split('.');
        if (splitArray[splitArray.length - 1] === 'dlog') {
            dataArray.unshift('Download As CSV');
            dataArray[1] += ' As Binary';
        }
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: dataArray
        });
        popover.onWillDismiss((data) => {
            console.log(data);
            if (data == null) { return; }
            if (data.option === 'Delete') {
                this.deleteFile(storageLocation, file)
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((e) => {
                        console.log(e);
                    });
            }
            else if (data.option === 'Download' || data.option === 'Download As Binary') {
                this.downloadFile(storageLocation, file);
            }
            else if (data.option === 'Download As CSV') {
                this.convertRemoteFileToCsv(storageLocation, file);
            }
        });
        popover.present({
            ev: event
        });
    }

    close() {
        this.viewCtrl.dismiss();
    }

    private verifyLocalLogFile(file: ArrayBuffer, fileSize: number, fileName: string) {
        if (this.isValidHeader(file)) {
            let trimmedArrBuff = file.slice(512);
            let binaryData = new Int16Array(trimmedArrBuff);
            this.exportBinaryDataAsCsv(binaryData, fileName);
        }
        else {
            this.toastService.createToast('logInvalidFileType', true, undefined, 5000);
        }
    }

    private exportBinaryDataAsCsv(binaryData: any, fileName: string) {
        let dataContainer: DataContainer = {
            data: [],
            yaxis: 1,
            lines: {
                show: true
            },
            points: {
                show: false
            }
        };
        for (let i = 0; i < binaryData.length; i++) {
            let dt = 1 / (this.fileSampleRate);
            dataContainer.data.push([i * dt, binaryData[i] / 1000]);
        }
        console.log(dataContainer);
        let splitArray = fileName.split('.');
        this.exportService.exportGenericCsv(splitArray.slice(0, splitArray.length - 1).join(''), [dataContainer], [0], [{
            instrument: 'Logger',
            seriesNumberOffset: 0,
            xUnit: 's',
            yUnit: 'V',
            channels: [0]
        }], 500, this.stopReasonArray[this.stopReason]);
    }

    private convertRemoteFileToCsv(storageLocation: string, file: string) {
        let loading;
        this.verifyDigilentLogFile(storageLocation, file)
            .then((data) => {
                console.log(data);
                return this.checkFileAndConfirm(storageLocation, file);
            })
            .then((data) => {
                console.log(data);
                loading = this.loadingService.displayLoading('Downloading file and converting...');
                return this.readFile(storageLocation, file, 512, -1, 600000);
            })
            .then((data) => {
                console.log(data);
                if (data.file == undefined) { throw 'Error getting file'; }
                let arrayBuff: ArrayBuffer = this.createArrayBufferFromString(data.file);
                let binaryData = new Int16Array(arrayBuff);
                this.exportBinaryDataAsCsv(binaryData, file);
                loading.dismiss();
            })
            .catch((e) => {
                console.log(e);
                if (loading != undefined) loading.dismiss();
                if (e === 'cancel') { return; }
                this.toastService.createToast('fileReadErr', true, undefined, 5000);
            });
    }

    private isValidHeader(fileHeader: ArrayBuffer): boolean {
        /* 
        struct _AHdr
        {
            (0)  const uint8_t   endian;             // 0 - little endian 1 - big endian
            (1)  const uint8_t   cbSampleEntry;      // how many bytes per sample, OpenScope = 2
            (2)  const uint16_t  cbHeader;           // how long is this header structure
            (4)  const uint16_t  cbHeaderInFile;     // how much space is taken in the file for the header, sector aligned (512)
            (6)  const uint16_t  format;             // General format of the header and potential data
            (8)  const uint32_t  revision;           // specific header revision (within the general format)
            (12) const uint64_t  voltageUnits;       // divide the voltage of each sample by this to get volts.
            (20)       uint32_t  stopReason;         // reason for logging stopping; 0 = Normal, 1 = Forced, 2 = Error, 3 = Overflow, 4 = unknown
            (24)       uint64_t  iStart;             // what sample index is the first index in the file, usually 0
            (32)       uint64_t  actualCount;        // how many samples in the file.
            (40) const uint64_t  sampleFreqUnits;    // divide uSPS by sampleFreqUnits to get samples per second
            (48)       uint64_t  uSPS;               // sample rate in micro samples / second
            (56) const uint64_t  delayUnits;         // divide psDelay by delayUnits to get the delay in seconds.
            (64)       int64_t   psDelay;            // how many pico seconds a delay from the start of sampling until the first sample was taken, usually 0
        } __attribute__((packed)) AHdr;
        */

        let dataView = new DataView(fileHeader);
        let littleEndian = dataView.getUint8(0) === 0;
        //let sampleEntrySize = dataView.getUint8(1);
        //let headerUsedSize = dataView.getUint16(2, littleEndian);
        let headerFullSize = dataView.getUint16(4, littleEndian);
        let headerFormat = dataView.getUint16(6, littleEndian);
        let headerVersion = dataView.getUint32(8, littleEndian);
        this.stopReason = dataView.getUint32(20, littleEndian);

        // Uint64 cannot be calculated with two getUint32 and then bitshift because it will overflow for bigger numbers.
        // Instead, multiply by 2^(±x) to shift left right by x respectively
        let sfUnits1 = dataView.getUint32(40, littleEndian);
        let sfUnits2 = dataView.getUint32(44, littleEndian);
        let actualSFUnits = littleEndian ? sfUnits2 * Math.pow(2, 32) + sfUnits1 : sfUnits1 * Math.pow(2, 32) + sfUnits2;

        let rate1 = dataView.getUint32(48, littleEndian);
        let rate2 = dataView.getUint32(52, littleEndian);
        this.fileSampleRate = (littleEndian ? rate2 * Math.pow(2, 32) + rate1 : rate1 * Math.pow(2, 32) + rate2) / actualSFUnits;
        console.log(littleEndian, headerFullSize, headerFormat, headerVersion, this.stopReason, actualSFUnits , this.fileSampleRate);
        return (headerVersion === 1 && headerFormat === 1 && headerFullSize === 512);
    }

    private verifyDigilentLogFile(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.readFile(storageLocation, file, 0, 512)
                .then((data) => {
                    if (data.file == undefined) { reject('Error getting file'); return; }
                    let arrayBuff: ArrayBuffer = this.createArrayBufferFromString(data.file);
                    if (this.isValidHeader(arrayBuff)) {
                        resolve(data);
                    }
                    else {
                        reject('Invalid file header');
                    }
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    toggleShowJasper() {
        this.showTheAlmightyJasper = !this.showTheAlmightyJasper;
    }
    
    jasperClick(event) {
        this.jasperCoords.x = event.clientX;
        this.jasperCoords.y = event.clientY;
        this.elementRef.nativeElement.onmousemove = this.elementRef.nativeElement.parentElement.firstElementChild.onmousemove = (e) => {
            let diffX = this.jasperCoords.x - e.clientX;
            let diffY = this.jasperCoords.y - e.clientY;
            this.jasperTop = (parseInt(this.jasperTop) - diffY) + 'px';
            this.jasperLeft = (parseInt(this.jasperLeft) - diffX) + 'px';
            this.jasperCoords.x = e.clientX;
            this.jasperCoords.y = e.clientY;
        };
        this.elementRef.nativeElement.onmouseup = this.elementRef.nativeElement.parentElement.firstElementChild.onmouseup = (event) => {
            this.elementRef.nativeElement.onmousemove = this.elementRef.nativeElement.parentElement.firstElementChild.onmousemove = null;
            this.elementRef.nativeElement.onmouseup = this.elementRef.nativeElement.parentElement.firstElementChild.onmouseup = null;
        };
    }
}
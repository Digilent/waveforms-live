import { Component } from '@angular/core';
import { ViewController, PopoverController } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';
import { ExportService } from '../../services/export/export.service';

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

    constructor(
        private deviceManagerService: DeviceManagerService,
        private viewCtrl: ViewController,
        private popoverCtrl: PopoverController,
        private toastService: ToastService,
        private exportService: ExportService
    ) {
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
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

    private readFile(storageLocation: string, file: string, filePosition: number = 0, length: number = -1): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.read(storageLocation, file, filePosition, length).subscribe(
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
        this.readFile(storageLocation, file)
            .then((data) => {
                console.log(data);
                let fileString = data.file;
                let fileArrBuff: ArrayBuffer = this.createArrayBufferFromString(fileString);
                this.exportService.exportBinary(file, fileArrBuff, 500, false);
            })
            .catch((e) => {
                console.log(e);
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

    getFiles(storageLocation: string) {
        if (this.showFolder[storageLocation].files != undefined) { return; }
        this.listFiles(storageLocation)
            .then((data) => {
                console.log(data);
                this.showFolder[storageLocation]['files'] = data.file[0].files;
                if (storageLocation === 'flash') {
                    this.showFolder[storageLocation]['files'] = this.showFolder[storageLocation]['files'].filter((item) => {
                        return item.indexOf('^^profile^^') !== -1;
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
        let fileReader = new FileReader();
        fileReader.onerror = ((e) => {
            console.log('error');
            console.log(e);
        });
        fileReader.onload = ((file: any) => {
            console.log(file);
            let fileSize = file.loaded;
            let arrBuffFile = file.target.result;
            this.verifyLocalLogFile(arrBuffFile, fileSize, fileName);

        });
        fileReader.readAsArrayBuffer(event.target.files[0]);
    }

    selectFile(event, file: string, storageLocation: string) {
        let dataArray = ['Delete', 'Download'];
        let splitArray = file.split('.');
        if (splitArray[splitArray.length - 1] === 'dlog') {
            dataArray.push('Convert To CSV');
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
            else if (data.option === 'Download') {
                this.downloadFile(storageLocation, file);
            }
            else if (data.option === 'Convert To CSV') {
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
            this.exportBinaryData(binaryData, fileName);
        }
        else {
            this.toastService.createToast('fileReadErr', true, undefined, 5000);
        }
    }

    private exportBinaryData(binaryData: any, fileName: string) {
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
            let dt = 1 / (this.fileSampleRate / 1000000);
            dataContainer.data.push([i * dt, binaryData[i]]);
        }
        console.log(dataContainer);
        let splitArray = fileName.split('.');
        this.exportService.exportGenericCsv(splitArray.slice(0, splitArray.length - 1).join(''), [dataContainer], [0], [{
            instrument: 'Logger',
            seriesNumberOffset: 0,
            xUnit: 's',
            yUnit: 'V',
            channels: [0]
        }], 500);
    }

    private convertRemoteFileToCsv(storageLocation: string, file: string) {
        this.verifyDigilentLogFile(storageLocation, file)
            .then((data) => {
                console.log(data);
                return this.readFile(storageLocation, file, 512, -1);
            })
            .then((data) => {
                console.log(data);
                if (data.file == undefined) { throw 'Error getting file'; }
                let arrayBuff: ArrayBuffer = this.createArrayBufferFromString(data.file);
                let binaryData = new Int16Array(arrayBuff);
                this.exportBinaryData(binaryData, file);
            })
            .catch((e) => {
                console.log(e);
                this.toastService.createToast('fileReadErr', true, undefined, 5000);
            });
    }

    private isValidHeader(fileHeader: ArrayBuffer): boolean {
        let dataView = new DataView(fileHeader);
        let littleEndian = dataView.getUint8(0) === 0;
        // FAT filesystem --> LITTLE ENDIAN
        let sampleEntrySize = dataView.getUint8(1);
        let headerUsedSize = dataView.getUint16(2, littleEndian);
        let headerFullSize = dataView.getUint16(4, littleEndian);
        let headerFormat = dataView.getUint16(6, littleEndian);
        let headerVersion = dataView.getUint32(8, littleEndian);
        // Rate cannot be calculated with two getUint32 and then bitshift because it will overflow for bigger numbers.
        // Instead, multiply by 2^(±x) to shift left right by x respectively
        let rate1 = dataView.getUint32(12, littleEndian);
        let rate2 = dataView.getUint32(16, littleEndian);
        this.fileSampleRate = littleEndian ? rate2 * Math.pow(2, 32) + rate1 : rate1 * Math.pow(2, 32) + rate2;
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
}
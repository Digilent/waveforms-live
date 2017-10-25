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
            });
    }

    toggleFolder(storageLocation: string) {
        this.showFolder[storageLocation].show = !this.showFolder[storageLocation].show;
        if (this.showFolder[storageLocation].show) {
            this.getFiles(storageLocation);
        }
    }

    selectFile(event, file: string, storageLocation: string) {
        let dataArray = ['Delete', 'Download', 'Convert To CSV'];
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
                this.convertFileToCsv(storageLocation, file);
            }
        });
        popover.present({
            ev: event
        });
    }

    close() {
        this.viewCtrl.dismiss();
    }

    private convertFileToCsv(storageLocation: string, file: string) {
        this.verifyDigilentLogFile(storageLocation, file)
            .then((data) => {
                console.log(data);
                if (data.file == undefined) { throw 'Error getting file' }
                let arrayBuff: ArrayBuffer = this.createArrayBufferFromString(data.file);
                let bufView = new Uint8Array(arrayBuff);
                // FAT filesystem --> LITTLE ENDIAN
                let i = 0;
                let endian = bufView[i++];
                let headerUsedSize;
                let headerFullSize;
                let headerVersion;
                let headerFormat;
                let sampleEntrySize;
                let rate;
                if (endian === 0) {
                    sampleEntrySize = bufView[i++];
                    headerUsedSize = bufView[i++] | (bufView[i++] << 8);
                    headerFullSize = bufView[i++] | (bufView[i++] << 8);
                    headerFormat = bufView[i++] | (bufView[i++] << 8);
                    headerVersion = bufView[i++] | (bufView[i++] << 8) | (bufView[i++] << 16) | (bufView[i++] << 24);
                    rate = bufView[i++] | (bufView[i++] << 8) | (bufView[i++] << 16) | (bufView[i++] << 24) | (bufView[i++] << 32) | (bufView[i++] << 40) | (bufView[i++] << 48) | (bufView[i++] << 56);
                }
                /* let headerUsedSize = bufView[i++] | (bufView[i++] << 8);
                let headerFullSize = bufView[i++] | (bufView[i++] << 8);
                let headerVersion = bufView[i++]| (bufView[i++] << 8) | (bufView[i++] << 16) | (bufView[i++] << 24);
                let headerFormat = bufView[i++]| (bufView[i++] << 8) | (bufView[i++] << 16) | (bufView[i++] << 24);
                let sampleEntrySize = bufView[i++] | (bufView[i++] << 8); */
                console.log(headerUsedSize, headerFullSize, headerVersion, headerFormat, sampleEntrySize, rate);
                if (headerVersion === 1 && headerFormat === 1 && headerFullSize === 512 && headerUsedSize === 20) {
                    //Valid
                    return this.readFile(storageLocation, file, 512, -1);
                }
                else {
                    throw 'Invalid file header';
                }
            })
            .then((data) => {
                console.log(data);
                if (data.file == undefined) { throw 'Error getting file'; }
                let arrayBuff: ArrayBuffer = this.createArrayBufferFromString(data.file);
                let binaryData = new Int16Array(arrayBuff);
                let dataContainer: DataContainer = {
                    data: Array.prototype.slice.call(binaryData),
                    yaxis: 1,
                    lines: {
                        show: true
                    },
                    points: {
                        show: false
                    }
                };
                console.log(dataContainer);
                this.exportService.exportGenericCsv(file + '.csv', [dataContainer], [0], [{
                    instrument: 'Logger',
                    seriesNumberOffset: 0,
                    xUnit: 's',
                    yUnit: 'V',
                    channels: [1]
                }]);
            })
            .catch((e) => {
                console.log(e);
            });
    }

    private verifyDigilentLogFile(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.readFile(storageLocation, file, 0, 512)
                .then((data) => {
                    resolve(data);
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }
}
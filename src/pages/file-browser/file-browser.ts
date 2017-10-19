import { Component } from '@angular/core';
import { ViewController, PopoverController } from 'ionic-angular';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';
import { ExportService } from '../../services/export/export.service';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

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

    private readFile(storageLocation: string, file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.activeDevice.file.read(storageLocation, file, 0, -1).subscribe(
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
        let dataArray = ['Delete', 'Download'];
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
        });
        popover.present({
            ev: event
        });
    }

    close() {
        this.viewCtrl.dismiss();
    }
}
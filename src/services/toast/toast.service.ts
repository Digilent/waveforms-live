import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

declare var waveformsLiveDictionary: any;

@Injectable()
export class ToastService {

    public toastCtrl: ToastController;

    constructor(_toastCtrl: ToastController) {
        console.log('toast service constructor');
        this.toastCtrl = _toastCtrl;
    }

    createToast(key: string, showCloseButton?: boolean, stringToConcat?: string, duration?: number) {
        return new Promise<any>((resolve, reject) => {
            showCloseButton = showCloseButton || false;
            stringToConcat = stringToConcat || '';
            duration = duration == undefined ? 3000 : duration;
            let messageToDisplayObject = this.getMessage(key);
            if (messageToDisplayObject.statusCode > 0) {
                reject(messageToDisplayObject);
                return;
            }
            let toast = this.toastCtrl.create({
                message: messageToDisplayObject.message + stringToConcat,
                showCloseButton: showCloseButton,
                duration: duration,
                position: 'bottom'
            });
            toast.present();
            resolve(messageToDisplayObject);
        });
    }

    getMessage(key: string) {
        return waveformsLiveDictionary.getMessage(key);
    }

}
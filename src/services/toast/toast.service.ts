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

    createToast(key: string, showCloseButton?: boolean, stringToConcat?: string) {
        return new Promise<Object>((resolve, reject) => {
            showCloseButton = showCloseButton || false;
            stringToConcat = stringToConcat || '';
            let messageToDisplayObject = this.getMessage(key);
            if (messageToDisplayObject.statusCode > 0) {
                reject(messageToDisplayObject);
            }

            let toast = this.toastCtrl.create({
                message: messageToDisplayObject.message + stringToConcat,
                showCloseButton: showCloseButton,
                duration: 3000,
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
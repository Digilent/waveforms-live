import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

declare var waveformsLiveErrorDictionary: any;

@Injectable()
export class ToastService {

    public toastCtrl: ToastController;
    public errorDictionary: string = waveformsLiveErrorDictionary;

    constructor(_toastCtrl: ToastController) {
        console.log('toast service constructor');
        this.toastCtrl = _toastCtrl;
    }

    createToast(message?: string, error?: boolean, errorDictionaryIndex?: number) {
        //TODO Change this so that ALL toasts are predefined in dictionary?
        let messageToDisplay = message == undefined ? '' : message;
        let errorMessage = error == undefined ? false : error;

        if (errorDictionaryIndex != undefined) {
            errorMessage = true;
            messageToDisplay = this.getErrorMessage(errorDictionaryIndex);
        }

        messageToDisplay = this.formatToastMessage(messageToDisplay);

        if (errorMessage && messageToDisplay.indexOf('Error:') === -1) {
            messageToDisplay = 'Error: ' + messageToDisplay;
        }

        if (!errorMessage && messageToDisplay === '') { return; }
        let toast = this.toastCtrl.create({
            message: messageToDisplay,
            showCloseButton: errorMessage,
            duration: errorMessage ? 5000 : 3000,
            position: 'bottom'
        });
        toast.present();
    }

    getErrorMessage(errorNumber: number) {
        return waveformsLiveErrorDictionary.getErrorMessage(errorNumber);
    }

    formatToastMessage(message: string) {
        return message.replace(/\w\S*/g, (txt) => { 
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); 
        });
    }

}
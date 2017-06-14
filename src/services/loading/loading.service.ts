import { Injectable } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';

@Injectable()
export class LoadingService {
    constructor(
        private loadingCtrl: LoadingController
    ) {

    }

    displayLoading(message: string): Loading {
        let loading = this.loadingCtrl.create({
            content: message,
            spinner: 'crescent',
            cssClass: 'custom-loading-indicator'
        });
        loading.present();
        return loading;
    }
}
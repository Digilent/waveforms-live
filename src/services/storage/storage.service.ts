import {Storage} from '@ionic/storage';
import {Injectable, EventEmitter} from '@angular/core';

@Injectable()
export class StorageService {
    public storage: Storage;
    public saveLoadEventEmitter: EventEmitter<any> = new EventEmitter();

    constructor(_storage: Storage) {
        this.storage = _storage;
        console.log('storage constructor');
    }

    //Get data from SqlStorage
    getData(name: string) {
        return this.storage.get(name);
    }

    //Save data to SqlStorage
    saveData(name: string, jsonString: string) {
        this.storage.set(name, jsonString);
    }

    //Remove data by keyname
    removeDataByKey(key: string) {
        this.storage.remove(key);
    }

    //Clear all data from storage
    clearAll() {
        this.storage.clear();
    }

    //Emit save event to all listeners
    saveSettings() {
        console.log('in storage service about to emit');
        this.saveLoadEventEmitter.next('save');
        console.log('emitted from storage service with .next');
    }

    //Emit load event to all listeners
    loadSettings() {
        console.log('in storage service about to emit');
        this.saveLoadEventEmitter.next('load');
        console.log('emitted from storage service with .next');
    }
}
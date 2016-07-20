import {Storage, SqlStorage} from 'ionic-angular';
import {Injectable, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class StorageService {
    private storage: Storage;
    public saveLoadEventEmitter: EventEmitter<any> = new EventEmitter();

    constructor() {
        this.storage = new Storage(SqlStorage, {name:'settings'});
        console.log('storage constructor');
    }

    getData(name: string) {
        return this.storage.get(name);
    }

    saveData(name: string, jsonString: string) {
        this.storage.set(name, jsonString);
    }

    removeDataByKey(key: string) {
        this.storage.remove(key);
    }

    clearAll() {
        this.storage.clear();
    }

    advancedQuery(query: string, params: Array<any>) {
        return this.storage.query(query, params);
    }

    saveSettings() {
        console.log('in storage service about to emit');
        this.saveLoadEventEmitter.next('save');
        console.log('emitted from storage service with .next');
    }

    loadSettings() {
        console.log('in storage service about to emit');
        this.saveLoadEventEmitter.next('load');
        console.log('emitted from storage service with .next');
    }
}
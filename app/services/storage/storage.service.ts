import {Storage, SqlStorage} from 'ionic-angular';
import {Injectable} from '@angular/core';

@Injectable()
export class StorageService {
    private storage: Storage;

    constructor() {
        this.storage = new Storage(SqlStorage, {name:'settings'});
        console.log('storage constructor');
    }

    getData(name: string) {
        return this.storage.get(name);
    }

    saveData(name: string, JsonString: string) {
        this.storage.set(name, JsonString);
    }

    removeDataByKey(key: string) {
        this.storage.remove(key);
    }

    clearAll() {
        this.storage.clear();
    }
}
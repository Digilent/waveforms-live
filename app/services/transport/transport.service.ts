import {Injectable} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {TransportComponent} from '../../components/transport/transport.component';
import {HttpTransportComponent} from '../../components/transport/http-transport.component';

@Injectable()
export class TransportService {

    private http: Http;
    private transport: TransportComponent;

    constructor(_http: Http, _uri: string) {
        console.log('Transport Service Parent Constructor');
        this.http = _http;
        this.transport = new HttpTransportComponent(this.http, _uri);
    }

    //Set transport uri
    setUri(uri) {
        this.transport.setUri(uri);
    }

    //Call writeRead on transport component
    writeRead(endpoint: string, sendData: any, dataType: string): Observable<any> {
        return this.transport.writeRead(endpoint, sendData, dataType);
    }

    //Call streamFrom on stransport component
    streamFrom(endpoint: string, sendData: Object, dataType: string, delay = 0): Observable<any> {
        return this.transport.streamFrom(endpoint, sendData, dataType, delay);
    }

    //Stop all transport streams
    stopStream() {
        this.transport.stopStream();
    }

    //Get type of transport service (parent)
    getType() {
        return 'Parent';
    }
}
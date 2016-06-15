import {Component} from '@angular/core';
import {Http, HTTP_PROVIDERS} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {TransportComponent} from './transport.component';

@Component({
    viewProviders: [HTTP_PROVIDERS],
    providers: [Http, HTTP_PROVIDERS]
})
export class HttpTransportComponent extends TransportComponent {

    private http: Http;

    //private dataSource: ;;
    //private dataSourceSubscription: any; 

    constructor(_http: Http, _rootUri: string) {
        console.log('Transport HTTP Contructor');
        super();

        this.http = _http;
        this.rootUri = _rootUri;

        this.http.get('https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod').subscribe((res) => {
            console.log('HTTP Done: ', res);
        }, (err) => {
            console.log(err);
        })
    }

    writeRead(endpoint: string, sendData: Object): Observable<any> {
        return this.http.post(this.rootUri + endpoint, JSON.stringify(sendData));
    }

    getType() {
        return 'HTTP';
    }
}
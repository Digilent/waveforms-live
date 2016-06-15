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
    }

    writeRead(endpoint: string, sendData: Object): Observable<any> {
        return Observable.create((observer) => {
            this.http.post(this.rootUri + endpoint, JSON.stringify(sendData)).subscribe(
                (data: any) => {
                    let dataObj = JSON.parse(data._body);
                    //Handle device errors and warnings
                    if (dataObj.statusCode < 1) {
                        observer.next(dataObj);
                        observer.complete();
                    }
                    else {
                        observer.error(dataObj.statusCode);
                    }
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        })
    }

    getType() {
        return 'Http';
    }
}
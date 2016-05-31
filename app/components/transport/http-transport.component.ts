import {Component} from 'angular2/core';
import {Http, HTTP_PROVIDERS} from 'angular2/http';
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

    constructor(_http: Http) {
        console.log('Transport HTTP Contructor');        
        super();

        this.http = _http;
        this.http.get('https://0u7h6sgzf6.execute-api.us-east-1.amazonaws.com/prod').subscribe((res) => {
            console.log('HTTP Done: ', res);
        }, (err) => {
            console.log(err);
        })
    }
    
     
    getType()
    {
        return 'HTTP';
    }
}
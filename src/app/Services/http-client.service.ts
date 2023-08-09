import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { HttpHandler, HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

  private httpClient: HttpClient;
  authorizationString = 'X-Authorization-Firebase'; // 'Authorization';
  constructor(private commonService: CommonService, private handler: HttpHandler) {
    this.httpClient = new HttpClient(this.handler);
  }
  getAuthoriztionCode() {
    return localStorage.getItem('token');
  }
  get(url: string, options?: any, isContentJSON: boolean = true): any{ // Observable<any> {
      console.log('IN NEW HTTP CLIENT SERVICE');
      console.log(url);
      if (!options) {
          // console.log("NOO OPTIONS");
          options = {};
      }
      let headers;
      if (!options.headers) {
          // console.log("NO HEADERS");
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }
      headers = headers.set('Content-Type', 'application/json;UTF-8');

      if (this.commonService.isValid(this.getAuthoriztionCode())) {
          headers = headers.set(this.authorizationString, this.getAuthoriztionCode());
      } else {
          headers = headers.append(this.authorizationString, '');
      }
      if (options.responseType === 'blob') {
          options.headers = headers.set('Content-Type', 'application/octet-stream');
      } else {
          options.headers = headers;
      }
      console.log('OPTIONS');
      console.log(options);
      return this.httpClient.get(url, options);
  }
  post(url: string , data: any , options?: any, isContentJSON: boolean = true): Observable<any> {
      console.log('IN NEW HTTP POST SERVICE');
      console.log('IN POST');
      if (!options) {
          options = {};
      }
      let headers;
      if (!options.headers) {
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }

      if (this.commonService.isValid(this.getAuthoriztionCode())) {
        headers = headers.set(this.authorizationString, this.getAuthoriztionCode());
      } else {
        headers = headers.set(this.authorizationString, '');
      }
    //   options.headers = headers;
      if (options.responseType === 'blob') {
            options.headers = headers.set('Content-Type', 'application/octet-stream');
        } else {
            options.headers = headers;
        }
      console.log('REQUEST SENT');
      if (!this.commonService.isValid(options.observe)) {
        options.observe = 'response';
      }
      console.log(options);
      return this.httpClient.post(url, data, options);
  }
  postJson(url: string , data: any , options?: any, isContentJSON: boolean = true): Observable<any> {
      console.log('IN NEW HTTP POST JSON SERVICE');
      if (!options) {
          options = {};
      }
      let headers;
      if (!options.headers) {
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }
      headers = headers.set('Content-Type', 'application/json; charset=UTF-8')
                      .append(this.authorizationString, this.getAuthoriztionCode());
      options.headers = headers;
      if (!this.commonService.isValid(options.observe)) {
        options.observe = 'response';
      }

      return this.httpClient.post(url, data, options); // return super.post(url,data, options)//.timeout(1000*180);
  }
  delete(url: string , options?: any, isContentJSON: boolean = true): Observable<any> {
      console.log('IN NEW HTTP DELETE SERVICE');
      if (!options) {
          options = {};
      }
      let headers;
      if (!options.headers) {
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }
      headers = headers.set('Content-Type', 'application/json; charset=UTF-8')
                      .append(this.authorizationString, this.getAuthoriztionCode());
      options.headers = headers;
      if (!this.commonService.isValid(options.observe)) {
        options.observe = 'response';
      }
      return this.httpClient.delete(url, options); // return super.delete(url, options)//.timeout(1000*180);
  }

  patch(url: string , data: any , options?: any, isContentJSON: boolean = true): Observable<any> {
      console.log('IN NEW HTTP PATCH SERVICE');
      if (!options) {
          options = {};
      }
      let headers;
      if (!options.headers) {
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }
      headers = headers.set('Content-Type', 'application/json; charset=UTF-8')
                      .append(this.authorizationString, this.getAuthoriztionCode());
      options.headers = headers;
      if (!this.commonService.isValid(options.observe)) {
        options.observe = 'response';
      }
      return this.httpClient.patch(url, data, options); // return super.patch(url,data, options)//.timeout(1000*180);
  }
  put(url: string , data: any , options?: any, isContentJSON: boolean = true): Observable<any> {
      console.log('IN NEW HTTP PUT SERVICE');
      if (!options) {
          options = {};
      }
      let headers;
      if (!options.headers) {
          headers = new HttpHeaders();
      } else {
          headers = options.headers;
      }
      headers = headers.set('Content-Type', 'application/json; charset=UTF-8')
                      .append(this.authorizationString, this.getAuthoriztionCode());
      options.headers = headers;
      // if(isContentJSON) {options.headers.append('Content-Type','application/json; charset=UTF-8');}
      if (!this.commonService.isValid(options.observe)) {
        options.observe = 'response';
      }
      return this.httpClient.put(url, data, options); // return super.put(url,data, options)//.timeout(1000*180);
  }
}

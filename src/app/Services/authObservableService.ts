import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable({
  providedIn: 'root'
})
export class AuthObservableService {

  private _data = new Subject<Object>();
  private _dataStream$ = this._data.asObservable();
  private _subscriptions: Map<string, Array<Object>> = new Map<string, Array<Function>>();
  constructor() {
    console.log('IN AUTH OBSERVABLE CONS');
    this._dataStream$.subscribe(data => this._onEvent(data));
  }

  subscribe(event: string, className: string, callback: Function) {
    // console.log('IN SOCIAL AUTH SUBSCRIBER');
    const subscribers = this._subscriptions.get(event) || [];
    subscribers.push({ id : event + '_' + className, function : callback });
    this._subscriptions.set(event, subscribers);
    // console.log(subscribers);
    // console.log(this._subscriptions);
  }
  unsubscribe(event: string, className: string) {
    const subscribers = this._subscriptions.get(event) || [];
    const index = subscribers.findIndex( (val: any) => val.id === event + '_' + className );
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  }

  _onEvent(data: any) {
    // console.log(data);
    // console.log(this._subscriptions);
    const subscribers = this._subscriptions.get(data.event) || [];
    // console.log(subscribers);
    subscribers.forEach((subscription: any) => {
      const funct: Function = subscription.function;
      // console.log('foreach subscriber');
      // console.log(subscription);
      funct.call(null, data.data);
    });
  }

  subscribeForAuthStatus(classId: string, callback: Function) {
    const event = 'authStatus';
    this.subscribe( event, classId, callback );
  }
  unSubscribeForAuthStatus(classId: string) {
    const event = 'authStatus';
    this.unsubscribe(event, classId);
  }
  updateAuthStatus(status) {
    // console.log('UPDATING STATUS : ', status);
    this._data.next({
      event: 'authStatus',
      data: status,
      result: 'ok'
    });
  }

  subscribeForErrors(classId: string, callback: Function) {
    const event = 'errors';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForErrors(classId: string) {
    const event = 'errors';
    this.unsubscribe(event, classId);
  }
  updateErrors(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'errors',
      data: status,
      result: 'ok'
    });
  }


  subscribeForAuthenticationRequest(classId: string, callback: Function) {
    const event = 'authRequest';
    this.subscribe( event, classId, callback );
  }
  unSubscribeForAuthenticationRequest(classId: string) {
    const event = 'authRequest';
    this.unsubscribe(event, classId);
  }
  initiateAuthenticationRequest(status) {
    // console.log('initiateAuthenticationRequest : ', status);
    this._data.next({
      event: 'authRequest',
      data: status,
      result: 'ok'
    });
  }


  subscribeForDuplicateErrors(classId: string, callback: Function) {
    const event = 'duplicate-errors';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForDuplicateErrors(classId: string) {
    const event = 'duplicate-errors';
    this.unsubscribe(event, classId);
  }
  updateDuplicateErrors(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'duplicate-errors',
      data: status,
      result: 'ok'
    });
  }

  subscribeForLayerUploadStatus(classId: string, callback: Function) {
    const event = 'layer-upload-status';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForLayerUploadStatus(classId: string) {
    const event = 'layer-upload-status';
    this.unsubscribe(event, classId);
  }
  updateLayerUploadStatus(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'layer-upload-status',
      data: status,
      result: 'ok'
    });
  }


  subscribeToGetBaseLayerName(classId: string, callback: Function) {
    const event = 'base-layer-name';
    this.subscribe(event, classId, callback);
  }
  unSubscribeToGetBaseLayerName(classId: string) {
    const event = 'base-layer-name';
    this.unsubscribe(event, classId);
  }
  updateBaseLayerName(status) {
    // console.log('UPDATING base layer name : ', status);
    this._data.next({
      event: 'base-layer-name',
      data: status,
      result: 'ok'
    });
  }

  subscribeToGetReferenceSystem(classId: string, callback: Function) {
    const event = 'reference-system';
    this.subscribe(event, classId, callback);
  }
  unSubscribeToGetReferenceSystem(classId: string) {
    const event = 'reference-system';
    this.unsubscribe(event, classId);
  }
  updateReferenceSystem(status) {
    // console.log('UPDATING Referce system : ', status);
    this._data.next({
      event: 'reference-system',
      data: status,
      result: 'ok'
    });
  }

  
  subscribeToGetCoordinateSystem(classId: string, callback: Function) {
    const event = 'coordinate-system';
    this.subscribe(event, classId, callback);
  }
  unSubscribeToGetCoordinateSystem(classId: string) {
    const event = 'coordinate-system';
    this.unsubscribe(event, classId);
  }
  updateCoordinateSystem(status) {
    // console.log('UPDATING Referce system : ', status);
    this._data.next({
      event: 'coordinate-system',
      data: status,
      result: 'ok'
    });
  }

  subscribeToGetViewFactory(classId: string, callback: Function) {
    const event = 'view-factory';
    this.subscribe(event, classId, callback);
  }
  unSubscribeToGetViewFactory(classId: string) {
    const event = 'view-factory';
    this.unsubscribe(event, classId);
  }
  updateViewFactory(status) {
    // console.log('UPDATING Referce system : ', status);
    this._data.next({
      event: 'view-factory',
      data: status,
      result: 'ok'
    });
  }

  updateUnits(unitsData) {
    console.log('updateUnits : ', unitsData);
    this._data.next({
      event: 'unitsUpdate',
      data: unitsData,
      result: 'ok'
    });
  }

  subscribeForOrgName(classId: string, callback: Function) {
    const event = 'org-name';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForOrgName(classId: string) {
    const event = 'org-name';
    this.unsubscribe(event, classId);
  }
  updateOrgName(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'org-name',
      data: status,
      result: 'ok'
    });
  }


  subscribeForRefreshSites(classId: string, callback: Function) {
    const event = 'refersh-sites';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForRefreshSites(classId: string) {
    const event = 'refersh-sites';
    this.unsubscribe(event, classId);
  }
  updateRefreshSites(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'refersh-sites',
      data: status,
      result: 'ok'
    });
  }

  subscribeForTermsPage(classId: string, callback: Function) {
    const event = 'terms-page';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForTermsPage(classId: string) {
    const event = 'terms-page';
    this.unsubscribe(event, classId);
  }
  updateTermsPage(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'terms-page',
      data: status,
      result: 'ok'
    });
  }


  subscribeForGeorefToggleStatus(classId: string, callback: Function) {
    const event = 'geo-ref-toggle-status';
    this.subscribe(event, classId, callback);
  }
  unSubscribeForGeorefToggleStatus(classId: string) {
    const event = 'geo-ref-toggle-status';
    this.unsubscribe(event, classId);
  }
  updateGeorefToggleStatus(status) {
    // console.log('UPDATING Errors : ', status);
    this._data.next({
      event: 'geo-ref-toggle-status',
      data: status,
      result: 'ok'
    });
  }
}

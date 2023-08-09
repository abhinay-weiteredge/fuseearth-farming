import { Injectable } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';
import { Icon, Style } from 'ol/style.js';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import OlTileLayer from 'ol/layer/Tile';
import tiles from 'ol/source/TileWMS';
import { SearchLocationEvent } from './events/searchLocation-event';
import { ServerURLEvent } from './events/serverURL-event';
import { UploadEvent } from './events/upload-event';
import { BasemapService } from '../basemap/basemap.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { CommonService } from '../Services/common.service';
import { AuthObservableService } from '../Services/authObservableService';
import { LayersService } from '../Services/layers.service';
import { GeotowerService } from '../geotower/geotower.service';


@Injectable({
  providedIn: 'root'
})
export class GeobarService {
  private _events: any;
  private markersLayerList = [];
  commonService: CommonService = new CommonService();
  returnDataToGeobar: any;
  constructor(private basemapService: BasemapService, private authObsr: AuthObservableService,
              private ngProgress: NgProgress,
              private fireStorage: AngularFireStorage, private layerService: LayersService,
              private geoTowerService: GeotowerService) {
  }

  private _getEventOptions() {
    const basemap = this.basemapService.getCurrentBasemap();
    return {
      SearchLocation: {
        instance: new SearchLocationEvent(this.ngProgress, this.authObsr),
        event: 'coordinatesSearchUtil'
      },
      ServiceURL: {
        instance: new ServerURLEvent(this.ngProgress, this.basemapService),
        event: 'urlSearchUtil'
      },
      Upload: {
        instance: new UploadEvent(basemap, this.ngProgress, this.fireStorage, this.basemapService,
                              this.authObsr, this.layerService, this.geoTowerService, this),
        event: 'processUploadedFiles'
      },
      AwsUrl: {
        instance: new UploadEvent(basemap, this.ngProgress, this.fireStorage, this.basemapService,
                              this.authObsr, this.layerService, this.geoTowerService, this),
        event: 'processAwsUrlFiles'
      }
    };
  }

  activateEvent(options, eventName) {
    if (eventName === 'Upload' || eventName === 'ServiceURL' || eventName === 'AwsUrl') {
      options.geobar.setLayerUploadStatus(1);
      options.geobar.enableLayerUploadStatus();
    }
    this._events = this._getEventOptions();
    const event = this._events[eventName].event;
    this._events[eventName].instance[event](options);
  }

  /**These methods are for creating and adding marker to map */
  private _getMarker(lat, lng) {
    const marker = new Feature({
      geometry: new Point([lng, lat])
    });
    marker.setStyle(new Style({
      image: new Icon(/** @type {olx.style.IconOptions} */({
        /* anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels', */
        anchor: [0.5, 30],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        // opacity: 0.75,
        src: '/assets/svgs/address-marker_30px.svg' // '/assets/search-colored-svg/PLB.svg'
        // src: '/assets/svgs/point-marker.svg' // '/assets/search-colored-svg/PLB.svg'
      }))
    }));
    return marker;
  }

  addMarker(lat, lng) {
    const marker = this._getMarker(lat, lng);
    this.removeMarker();
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker]
      })
    });
    vectorLayer.setZIndex(1001);
    this.basemapService.getCurrentBasemap().addLayer(vectorLayer);
    this.basemapService.getCurrentBasemap().values_.view.setCenter([+lng, +lat]);
    this.basemapService.getCurrentBasemap().getView().setZoom(17);
    this.markersLayerList.push(vectorLayer);
    // this.basemapService.setLoadScaleLine();
  }

  removeMarker() {
    this.markersLayerList.forEach((currentMarker) => {
      this.basemapService.getCurrentBasemap().removeLayer(currentMarker);
    });
    this.markersLayerList = [];
  }

  addwmsLayer(url, jsonObject) {
    console.log(url, jsonObject);
    const wmsSource = new tiles({
      url,
      projection: this.basemapService.getBaseMapProjection(),
      serverType: 'geoserver',
      extent: jsonObject.metadata
    });
    const wmsLayer = new OlTileLayer({
      extent: jsonObject.metadata,
      source: wmsSource,
      name: jsonObject.fileName
    });
    console.log(wmsSource);
    console.log(wmsLayer);
    this.basemapService.getCurrentBasemap().addLayer(wmsLayer);
    if (this.commonService.isValid(jsonObject.metadata)) {
      this.basemapService.getCurrentBasemap().getView().fit(jsonObject.metadata);
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);
    }
  }
}

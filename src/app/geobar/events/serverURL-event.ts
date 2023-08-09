import { WMSCapabilities } from 'ol/format';
import { NgProgress } from 'ngx-progressbar';
import { BasemapService } from '../../basemap/basemap.service';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import JSON from 'ol/format/EsriJSON';
import { AuthObservableService } from '../../Services/authObservableService';
import OlTileLayer from 'ol/layer/Tile';
import tiles from 'ol/source/TileWMS';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {fromLonLat} from 'ol/proj';
import { Fill, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';


export class ServerURLEvent {
  private basemapProjection;
  urlSearchOptions: any;
  Colors = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
  /* Colors.names = {
    Violet: '#9400D3',
    Indigo: '#4B0082',
    Blue: '#0000FF',
    Green: '#00FF00',
    Yellow: '#FFFF00',
    Orange: '#FF7F00',
    Red: '#FF0000',
  }; */

  constructor(private ngProgress: NgProgress, private basemapService: BasemapService) {
    this.basemapProjection = this.basemapService.getCurrentBasemap().getView().getProjection().code_;
  }

  setUploadStatusInPercentage(num): any {
    this.urlSearchOptions.geobar.setLayerUploadStatus(num);
  }
  hideLayerUploadStatus(): any {
    this.urlSearchOptions.geobar.hideLayerUploadStatus();
  }
  public urlSearchUtil(options): any {
    // this.ngProgress.start();
    this.ngProgress.ref().start();
    this.urlSearchOptions = options;
    const expression = /^(|\s)http|^https|localhost$|^127(?:\.[0-9])/gi;
    const regex = new RegExp(expression);
    if (options.inputValue.match(regex)) {
      let imagSrc = '';
      this.setUploadStatusInPercentage(30);
      const parser = new WMSCapabilities();
      const url = new URL(options.inputValue);
      let layerName = 'undefined'; // url.searchParams.get('layers').split(':')[1];
      const isWMSServiceURL = false;
      let isGeojsonServiceURL = false;
      const isQueryServiceURL = false;
      // condition-1: is input url have Layer(its wms service)
      console.log('options.inputValue.indexOf', options.inputValue.indexOf('=pjson'), options.inputValue);
      // TODO - layers shoud be last
      if (options.inputValue.indexOf('layers') > 0) {
        console.log('its inside layerName', url.searchParams.get('layers'));
        layerName = url.searchParams.get('layers').split(':')[1];
        // isWMSServiceURL = true;
        if (layerName === 'undefined' || layerName === undefined) {
          layerName = url.searchParams.get('layers').split(':')[0];
        }
        fetch(options.inputValue + '&REQUEST=GetCapabilities').then((response) => {
          console.log(response);
          return response.text();
        }).then((text) => {
          const result = parser.read(text);
          console.log('results ', result);
          // const extent = result.Capability.Layer.Layer.find(l => l.Name === layerName).EX_GeographicBoundingBox;
          const extent = result.Capability.Layer.EX_GeographicBoundingBox;
          console.log('extent ', extent);
          if (extent === undefined || extent === 'undefined') {
            imagSrc = options.inputValue
              + '&REQUEST=GetCapabilities&request=GetMap&FORMAT=image/png&width=768&height=755&version=1.1.0&srs=EPSG:4326&styles=';
          } else {
            imagSrc = options.inputValue + '&bbox=' + extent[0] + ',' + extent[1] + ',' + extent[2]
              + ',' + extent[3]
              + '&request=GetMap&FORMAT=image/png&width=768&height=755&version=1.1.0&srs=EPSG:4326&styles=';
          }
          console.log('what is imgsrc ', imagSrc);
          setTimeout(() => {
            options.geobar.loadURLElContent(imagSrc);
          }, 1000);
          const jsonObj = {
            fileName: layerName,
            filetype: 'url',
            firebaseUrl: imagSrc, // options.inputValue,
            metadata: extent
          };
          console.log(jsonObj);
          options.geobar.urlLayerjsonObj = jsonObj;
          this.addwmsLayer(imagSrc, jsonObj);
          this.basemapService.setLayerToGeotower(jsonObj);
          // this.ngProgress.done();
          this.ngProgress.ref().complete();
          this.setUploadStatusInPercentage(90);
          setTimeout(() => {
            this.setUploadStatusInPercentage(100);
          }, 1000);
        });
        this.setUploadStatusInPercentage(50);
      } else if (options.inputValue.indexOf('query') > 0 || options.inputValue.indexOf('=json') > 0) {
        // condition-2: is input url have query or json
        let fetchURL = options.inputValue;
        console.log('its inside query or json');
        if (options.inputValue.indexOf('=pjson') > 0) {
          // condition-2: is input url have query & pjson
          fetchURL = options.inputValue + '&where=1%3D1';
          this.fetchURLProcess(fetchURL, false, options);
          this.setUploadStatusInPercentage(50);
        } else if (options.inputValue.indexOf('=geojson') > 0) {
          fetchURL = options.inputValue + '&where=1%3D1';
          isGeojsonServiceURL = true;
          this.fetchURLProcess(fetchURL, true, options);
          this.setUploadStatusInPercentage(50);
        } else {
          fetchURL = options.inputValue + '&outSR=4326&f=json';
          this.fetchURLProcess(fetchURL, false, options);
          this.setUploadStatusInPercentage(50);
        }
      } else if (options.inputValue.indexOf('.geojson') > 0) {
        // condition-3: is input url have only geojson like arcgis hub
        const fetchURL = options.inputValue;
        console.log('its inside geojson');
        isGeojsonServiceURL = true;
        this.fetchURLProcess(fetchURL, true, options);
        this.setUploadStatusInPercentage(50);
      } else if (options.inputValue.indexOf('=pjson') > 0 && !(options.inputValue.indexOf('query') > 0)) {
        // condition -4, Its newly added for ca govt websites, allowing which url have pjson & not query
        console.log('its new format pjson with out query');
        let fetchURL = options.inputValue;
        fetch(fetchURL).then((response) => {
          console.log('results ', response);
          return response.json();
        }).then((jsonResults) => {
          console.log('response json and list of layers ', jsonResults.layers);
          if (jsonResults.layers !== undefined) {
            if (jsonResults.layers.length > 0) {
              /* jsonResults.layers.forEach(urlLayer => {
                fetchURL = fetchURL.split('?')[0] + '/' + urlLayer.id + '/query?f=pjson&where=1%3D1';
                this.fetchURLProcess(fetchURL, false, options);
              }); */
              fetchURL = fetchURL.split('?')[0] + '/' + jsonResults.layers[0].id + '/query?f=pjson&where=1%3D1';
              this.fetchURLProcess(fetchURL, false, options);
            }
          } else if (jsonResults.name !== null) {
            fetchURL = fetchURL.split('?')[0] + '/query?f=pjson&where=1%3D1';
            this.fetchURLProcess(fetchURL, false, options);
            this.setUploadStatusInPercentage(50);
          }
        }).catch(error => {
          console.log('what type error? ', error);
          this._getAlertMessage(options.geobar.alertComponent);
        });
      } else if (options.inputValue.indexOf('v1.json') > 0) {
        console.log('its else if part of vi website', options.inputValue);
        const fetchURL = options.inputValue;
        fetch(fetchURL).then((response) => {
          console.log('results ', response);
          return response.json();
        }).then((jsonResults) => {
          console.log('response json ', jsonResults, jsonResults.fuel_stations);
          if (jsonResults.fuel_stations === undefined || jsonResults.fuel_stations === 'undefined') {
            console.log('its errot ', jsonResults.error.code, jsonResults.error.message);
            options.geobar.activeSearchOptionASB = false;
            // this._getAlertMessage(options.geobar.alertComponent);
            const alertMessage = jsonResults.error.code + ' ' + jsonResults.error.message;
            const alert = options.geobar.alertComponent;
            alert.setAlertMessage(alertMessage);
            this.ngProgress.ref().complete();
            this.hideLayerUploadStatus();
            this.setUploadStatusInPercentage(100);
          } else if ((jsonResults.fuel_stations).length > 0) {
            const featuresList = [];
            let geojson;
            jsonResults.fuel_stations.forEach(record => {
              /* featuresList.push(new Feature({
                geometry: new Point(fromLonLat([record.longitude, record.latitude]))
              })); */
              featuresList.push({
                  type: 'Feature',
                  geometry : {
                      type: 'Point',
                      coordinates: [record.longitude, record.latitude],
                      },
                  properties : record,
               });
            });
            geojson = {
              type: 'FeatureCollection',
              features: featuresList
            };
            const arrayJson = [];
            const featureCollection = geojson;
            const randomNumber = Math.floor(Math.random() * (999 - 100)) + 100;
            if (featureCollection.fileName !== undefined && featureCollection.fileName !== null) {
            } else {
              featureCollection.fileName = 'Fuel_Stations_' + randomNumber;
            }
            arrayJson.push(featureCollection);
            this._layerPreview(featureCollection, true);
            const returnData = {
              firebaseUrl : fetchURL,
              filetype : 'url',
              metadata : arrayJson,
              fileName : featureCollection.fileName,
            };
            this.basemapService.setLayerToGeotower(returnData);
            this.ngProgress.ref().complete();
            this.setUploadStatusInPercentage(90);
            setTimeout(() => {
              this.setUploadStatusInPercentage(100);
            }, 1000);
          } else if (jsonResults.error) {
            console.log('its error ', jsonResults.error.code, jsonResults.error.message);
            options.geobar.activeSearchOptionASB = false;
            this._getAlertMessage(options.geobar.alertComponent);
            this.ngProgress.ref().complete();
            this.hideLayerUploadStatus();
            this.setUploadStatusInPercentage(100);
          }
        });
      } else if (options.inputValue.indexOf('v1.geojson') > 0) {
        console.log('its else if part of vi website', options.inputValue);
        const fetchURL = options.inputValue;
        isGeojsonServiceURL = true;
        fetch(fetchURL).then((response) => {
          console.log('results ', response);
          return response.json();
        }).then((featureCollection) => {
          console.log('results ', featureCollection, featureCollection.error);
          if (featureCollection.error !== undefined) {
            console.log('error find');
            // this._getAlertMessage(options.geobar.alertComponent);
            const alertMessage = featureCollection.error.code + ' ' + featureCollection.error.message;
            const alert = options.geobar.alertComponent;
            alert.setAlertMessage(alertMessage);
            this.ngProgress.ref().complete();
            this.hideLayerUploadStatus();
            this.setUploadStatusInPercentage(100);
            return;
          }
        });

        this.fetchURLProcess(fetchURL, true, options);
        this.setUploadStatusInPercentage(50);
      } else {
        console.log('its else part ', options.inputValue);
        options.geobar.activeSearchOptionASB = false;
        this._getAlertMessage(options.geobar.alertComponent);
        this.ngProgress.ref().complete();
        this.hideLayerUploadStatus();
        this.setUploadStatusInPercentage(100);
      }
      this.ngProgress.ref().complete();
    } else {
      console.log('its else part at end', options.inputValue);
      options.geobar.activeSearchOptionASB = false;
      this._getAlertMessage(options.geobar.alertComponent);
      this.ngProgress.ref().complete();
      this.hideLayerUploadStatus();
    }
  }

  private fetchURLProcess(fetchURL, isGeojson, options): any {
    console.log('IN fetchURLProcess');
    console.log(fetchURL);
    console.log(isGeojson);
    fetch(fetchURL).then((response) => {
      console.log('results ', response);
      return response.json();
    }).then((featureCollection) => {
      console.log('results ', featureCollection, featureCollection.error);
      if (featureCollection.error !== undefined) {
        console.log('error find');
        // this._getAlertMessage(options.geobar.alertComponent);
        // this._getAlertMessage(options.geobar.alertComponent);
        const alertMessage = featureCollection.error.code + ' ' + featureCollection.error.message;
        const alert = options.geobar.alertComponent;
        alert.setAlertMessage(alertMessage);
        this.ngProgress.ref().complete();
        this.hideLayerUploadStatus();
        this.setUploadStatusInPercentage(100);
        return;
      }
      const arrayJson = [];
      const randomNumber = Math.floor(Math.random() * (999 - 100)) + 100;
      if (featureCollection.fileName !== undefined && featureCollection.fileName !== null) {
      } else {
        featureCollection.fileName = 'urlLayer_' + randomNumber;
      }
      arrayJson.push(featureCollection);
      this._layerPreview(featureCollection, isGeojson);
      const returnData = {
        firebaseUrl : fetchURL,
        filetype : 'url',
        metadata : arrayJson,
        fileName : featureCollection.fileName,
      };
      this.basemapService.setLayerToGeotower(returnData);
      this.ngProgress.ref().complete();
      this.setUploadStatusInPercentage(90);
      setTimeout(() => {
        this.setUploadStatusInPercentage(100);
      }, 1000);
    }).catch(error => {
      console.log('caatch the error, need add alert message ', error);
      this._getAlertMessage(options.geobar.alertComponent);
      this.ngProgress.ref().complete();
      this.setUploadStatusInPercentage(100);
    });
  }
  private _layerPreview(geoJsonMapshaper, isGeojson): any {
    console.log('IN _layerPreview');
    console.log(geoJsonMapshaper);
    console.log(isGeojson);
    if (geoJsonMapshaper.length > 0) {
      geoJsonMapshaper.forEach((jsonObj) => {
        this._setLayerToMap(jsonObj, isGeojson);
      });
    } else {
      this._setLayerToMap(geoJsonMapshaper, isGeojson);
    }
  }

  private _setLayerToMap(geoJson, isGeojson): any {
    console.log('IN _setLayerToMap');
    console.log(geoJson);
    console.log(isGeojson);
    let featuresTypes = new GeoJSON();
    if (!isGeojson) {
      featuresTypes = new JSON();
    }
    const vectorSource = new VectorSource({
      features: (featuresTypes).readFeatures(geoJson, {
        featureProjection: this.basemapProjection
      })
    });
    // new code for coloring
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)'
    });
    const stroke = new Stroke({
      // color: '#319FD3',
      color: this.randomRainbowColor(0, 6),
      width: 1
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      /* style: this.getShapeStyle() */
      style: new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: 5
        }),
        fill,
        stroke,
      }),
    });
    vectorLayer.set('name', geoJson.fileName);
    this.basemapService.getCurrentBasemap().addLayer(vectorLayer);
    // new code for zoom to extent
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      console.log(currentLayer);
      if (geoJson.fileName === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getExtent();
        console.log('what is value of  extent ', extentValue);
        this.basemapService.getCurrentBasemap().getView().fit(extentValue);
        this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);
      }
    });
  }

  addwmsLayer(url, jsonObject): any {
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
    wmsLayer.set('name', jsonObject.fileName);
    wmsLayer.set('type', 'URL');
    this.basemapService.getCurrentBasemap().addLayer(wmsLayer);
    if (jsonObject.metadata !== undefined) {
      this.basemapService.getCurrentBasemap().getView().fit(jsonObject.metadata);
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);
    }
    /* this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (jsonObject.fileName === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getImageExtent();
        this.basemapService.getCurrentBasemap().getView().fit(extentValue);
      }
    }); */
  }

  private _getAlertMessage(alertComponent): any {
    this.setUploadStatusInPercentage(100);
    this.ngProgress.ref().complete();
    const alertMessage = 'Please enter valid URL';
    const alert = alertComponent;
    alert.setAlertMessage(alertMessage);
  }
  private randomRainbowColor(min, max): any {
    return this.Colors[Math.floor(Math.random() * (max - min + 1)) + min];
  }
}


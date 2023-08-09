import { Injectable, Output, EventEmitter } from '@angular/core';
import OlMap from 'ol/Map';
import { BasemapFactory } from './BasemapFactory';
import OlView from 'ol/View';
import { defaults as defaultControls, ScaleLine, Zoom } from 'ol/control.js';
import Geolocation from 'ol/Geolocation';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import PinchRotate from 'ol/interaction/PinchRotate';
import Projection from 'ol/proj/Projection.js';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import OlTileLayer from 'ol/layer/Tile';
import { get as getProjection } from 'ol/proj.js'
import { transform } from 'ol/proj';


proj4.defs(
  "EPSG:27700",
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 " +
  "+x_0=400000 +y_0=-100000 +ellps=airy " +
  "+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 " +
  "+units=m +no_defs"
);

proj4.defs(
  "EPSG:6933",
  "+proj=cea +lat_ts=30 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
);


proj4.defs(
  "EPSG:23032",
  "+proj=utm +zone=32 +ellps=intl " +
  "+towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs"
);

proj4.defs(
  "EPSG:5479",
  "+proj=lcc +lat_1=-76.66666666666667 +lat_2=" +
  "-79.33333333333333 +lat_0=-78 +lon_0=163 +x_0=7000000 +y_0=5000000 " +
  "+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 " +
  "+lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel " +
  "+towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs"
);
proj4.defs(
  "EPSG:3413",
  "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 " +
  "+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
);

proj4.defs(
  "EPSG:2163",
  "+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 " +
  "+a=6370997 +b=6370997 +units=m +no_defs"
);

proj4.defs(
  "ESRI:54009",
  "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 " + "+units=m +no_defs"
);

proj4.defs(
  "EPSG:2229",
  "+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118 +x_0=2000000.0001016" +
  "+y_0=500000.0001016001 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs "
);
proj4.defs("EPSG:4087", "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");

proj4.defs(
  "EPSG:6590",
  "+proj=lcc +lat_1=42.720 +lat_2=45.030 +lat_0=44.21666666666667 +lon_0=-72.75 +x_0=500000.0001016001 +y_0=0 +datum=NAD83 +units=us-ft +no_defs");

proj4.defs("EPSG:2227", "+proj=lcc +lat_1=38.43333333333333 +lat_2=37.06666666666667 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000.0001016 +y_0=500000.0001016001 +datum=NAD83 +units=us-ft +no_defs")
register(proj4);

proj4.defs("EPSG:26918", "+proj=utm +zone=18 +ellps=GRS80 +datum=NAD83 +units=m +no_defs")
register(proj4);

const proj26918 = getProjection('EPSG:26918');

const proj4087 = getProjection('EPSG:4087');

const proj2227 = getProjection('EPSG:2227')
const proj27700 = getProjection('EPSG:27700');
const proj6590 = getProjection('EPSG:6590');
// console.log(proj27700)
// JSON.stringify(proj27700);

const proj23032 = getProjection("EPSG:23032");
// console.log(proj23032,"123")
// JSON.stringify(proj23032);
// console.log(proj23032,"356")

const proj6933 = getProjection("EPSG:6933");

// proj23032.setExtent([-1206118.71, 4021309.92, 1295389.0, 8051813.28]);

const proj5479 = getProjection("EPSG:5479");
// JSON.stringify(proj5479);

// proj5479.setExtent([6825737.53, 4189159.8, 9633741.96, 5782472.71]);

const proj21781 = getProjection("EPSG:21781");
// JSON.stringify(proj21781);

// proj21781.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);

const proj3413 = getProjection("EPSG:3413");
// JSON.stringify(proj3413);

// proj3413.setExtent([-4194304, -4194304, 4194304, 4194304]);

const proj2163 = getProjection("EPSG:2163");
// JSON.stringify(proj2163);

// proj2163.setExtent([-8040784.5135, -2577524.921, 3668901.4484, 4785105.1096]);

const proj54009 = getProjection("ESRI:54009");
// JSON.stringify(proj54009);

// proj54009.setExtent([-18e6, -9e6, 18e6, 9e6]);
const proj2229 = getProjection("EPSG:2229");
proj2229.setExtent([5528230.8160, 1384701.5952, 7751890.9134, 2503239.6463]);


const proj3857 = getProjection("EPSG:3857");

const proj4326 = getProjection("EPSG:4326");
console.log(proj6590, proj2227, proj3857, "checkprojectionifconsts")


@Injectable({
  providedIn: 'root'
})
export class BasemapService {
  private _baseMapType: string;
  private _currentMap: OlMap;
  @Output() iconChanger: EventEmitter<any> = new EventEmitter();
  private projection = 'EPSG:4326';
  public projection3857Code = 'EPSG:3857';
  // #TODO: Need to remove this later.
  @Output() onLayerAddedToTower: EventEmitter<any> = new EventEmitter();
  @Output() onLoadDefaultLayers: EventEmitter<any> = new EventEmitter();
  @Output() onLoadScaleLine: EventEmitter<any> = new EventEmitter();
  @Output() onLoadOrientation: EventEmitter<any> = new EventEmitter();
  @Output() onGeobarDataAddingToPopup: EventEmitter<any> = new EventEmitter();

  public isOrientationEvent = false;

  projectionsList = [
    { name: 'EPSG:27700', projection: proj27700 },
    { name: 'EPSG:23032', projection: proj23032 },
    { name: 'EPSG:5479', projection: proj5479 },
    { name: 'EPSG:21781', projection: proj21781 },
    { name: 'EPSG:3413', projection: proj3413 },
    { name: 'EPSG:2163', projection: proj2163 },
    { name: 'EPSG:54009', projection: proj54009 },
    { name: 'EPSG:2229', projection: proj2229 },
    { name: 'EPSG:4326', projection: proj4326 },
    { name: 'EPSG:3857', projection: proj3857 },
  ]

  constructor() {
    this.updateLocation = this.updateLocation.bind(this);
  }

  getTransformedCoordinates(coordinate, source, destination) {
    var transformed_Coordinates = transform(coordinate, source, destination)
    return transformed_Coordinates
  }

  public getCurrentBasemap(): OlMap {
    return this._currentMap;
  }

  setMouseIcon(iconURL) {
    this.iconChanger.emit(iconURL);
  }

  setLayerToGeotower(clientLayerObj) {
    this.onLayerAddedToTower.emit(clientLayerObj);
  }

  setGeobarDataToPopup(data) {
    this.onGeobarDataAddingToPopup.emit(data);
  }

  setLoadDeafultLayers() {
    this.onLoadDefaultLayers.emit();
  }

  setLoadScaleLine() {
    this.onLoadScaleLine.emit();
  }

  setLoadOrientationValue(DegValue) {
    this.onLoadOrientation.emit(DegValue);
  }

  getSourceProjection(inputvalue) {
    console.log(inputvalue, "check input value in service")
    var projection;
    this.projectionsList.map((x) => {
      if (x.name === inputvalue) {
        projection = x.projection
      }
    })
    console.log(projection, "check projection...")
    return projection
  }


  // TODO: It should be good to initialize map in constructor
  public getBasemapByType(baseMapType: string, options) {
    const geolocation = new Geolocation({
      tracking: true
    });
    geolocation.on('change:position', () => {
      const position = geolocation.getPosition();
      options.longitude = position[0];
      options.latitude = position[1];
    });
    this._baseMapType = baseMapType;
    const basemapFactory = new BasemapFactory(baseMapType);
    const mapLayer: OlTileLayer = basemapFactory.getBaseMap().getMapTileLayer();
    mapLayer.setVisible(true);
    this._currentMap = new OlMap({
      controls: defaultControls().extend([
        new ScaleLine({
          className: 'ol-scale-text',
          target: options.scaleLine,
          units: 'us',
          bar: true,
          text: true
        }),
      ]),
      target: options.target,
      layers: [mapLayer],
      view: new OlView({
        center: [options.longitude, options.latitude],
        zoom: options.zoom,
        // #TODO: Need to remove this if this is not required.
        projection: this.projection,
        constrainRotation: false
      })
    });
    if (options.pageType === 'DEFAULT') {
      this.userLocation();
    }
    this._currentMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof DoubleClickZoom) {
        this._currentMap.removeInteraction(interaction);
      }
      if (interaction instanceof PinchRotate) {
        this._currentMap.removeInteraction(interaction);
      }
    });
    this._currentMap.getView().on('change:rotation', () => {
      console.log('fired ', this._currentMap.getView().getRotation());
      if (this.isOrientationEvent) {
        // console.log('its when rotate the orientation not from map map ', );
      } else {
        // console.log('its when rotate the map not from map rotate ', (this._currentMap.getView().getRotation()) / (Math.PI / 180 ));
        this.setLoadOrientationValue((this._currentMap.getView().getRotation()) / (Math.PI / 180));
      }
    });
    this.loadAllBaseMaps(options);
    return this._currentMap;
  }

  public loadAllBaseMaps(options) {
    let _basemapFactory = new BasemapFactory('openstreet');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    _basemapFactory = new BasemapFactory('satellite');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    _basemapFactory = new BasemapFactory('terrain');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    _basemapFactory = new BasemapFactory('bingsatellite');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    /* _basemapFactory = new BasemapFactory('bingstreet');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer()); */
    _basemapFactory = new BasemapFactory('googlestreet');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    _basemapFactory = new BasemapFactory('googleSatellite');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    _basemapFactory = new BasemapFactory('toner');
    this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    /* if (options.pageType === 'DEFAULT') {
      _basemapFactory = new BasemapFactory('bingsatellite');
      this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    } else {
      _basemapFactory = new BasemapFactory('bingstreet');
      this._currentMap.addLayer(_basemapFactory.getBaseMap().getMapTileLayer());
    } */
  }

  public getBaseMapProjection() {
    return this.projection;
  }
  public setBaseMapProjection(projection) {
    this.projection = projection;
  }
  userLocation() {
    if (navigator.geolocation) {
      console.log('changed- navigated true ');
      return navigator.geolocation.getCurrentPosition(this.updateLocation, this.handleLocationError, { timeout: 100000 });
    } else {
      console.log('Browser is so old');
    }
  }
  updateLocation(positionData) {
    console.log('changed- user location ');
    const latitude = positionData.coords.latitude;
    const longitude = positionData.coords.longitude;
    this.getCurrentBasemap().getView().setCenter([longitude, latitude]);
  }
  handleLocationError() {
    console.log('Browser block the location permission!!!');
  }
  getDestinationProjectionEquDistance() {
    return proj4087
  }

  getdestination2227proj() {
    return proj2227
  }

  getdestination6590proj() {
    return proj6590;
  }

  getdestination26918proj() {
    return proj26918;
  }
}

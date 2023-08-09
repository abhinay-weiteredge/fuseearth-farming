import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { defaults as defaultControls, ScaleLine, Zoom } from 'ol/control.js';
import { BasemapFactory } from '../basemap/BasemapFactory';
import OlTileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image.js';
// import Projection from 'ol/proj/Projection.js';
import Static from 'ol/source/ImageStatic.js';
import { Observable, Subject, Subscription } from 'rxjs';
import { transformExtent } from 'ol/proj';
import { get } from 'ol/proj';
import { register } from 'ol/proj/proj4.js';
import { unByKey } from 'ol/Observable.js';
import proj4 from 'proj4';
import { CommonService } from 'src/app/Services/common.service';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { GeorefService } from 'src/app/Services/georef.service';
// import {getCenter} from 'ol/extent';
import { AffineTransformation } from './affinetransformation';
// import {getCenter} from 'ol/extent';
// import { AffineTransformation } from '../affinetransformation';
// TODO - its new code
import { Projection, addCoordinateTransforms } from 'ol/proj';
import { rotate } from 'ol/coordinate';
import { buffer, getCenter, getTopLeft, getTopRight, getBottomLeft, getHeight, getWidth } from 'ol/extent';
import {fromLonLat, transform, addProjection, getTransform} from 'ol/proj';
import OlOverlay from 'ol/Overlay';
import { Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import CircleStyle from 'ol/style/Circle';
import {getVectorContext} from 'ol/render';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { fromExtent } from 'ol/geom/Polygon';


export class GeoRefPoints{
  link: number;
  xSource: string;
  xSourceViewMode: boolean;
  ySource: string;
  ySourceViewMode: boolean;
  xMapOrLatitude: string;
  xMapOrLatitudeViewMode: boolean;
  yMapOrLongitude: string;
  yMapOrLongitudeViewMode: boolean;
  residualX: string;
  residualY: string;
  residual: string;
  xMapOrLatitudeInitial: string;
  yMapOrLongitudeInitial: string;
}


@Component({
  selector: 'app-georef',
  templateUrl: './georef.component.html',
  styleUrls: ['./georef.component.scss']
})
export class GeorefComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() layerInfo: any = {};
  @Input() viewMode = 'georef';
  @Output() saveGeorefInfo: EventEmitter<any> = new EventEmitter<any>();
  @Output() markedPoints: EventEmitter<number> = new EventEmitter<any>();
  selectedTab = 'geo-ref';
  geoRefPoints: Array<GeoRefPoints> = [];

  imgWidth = 100;
  // imgHeight
  @ViewChild('geoRefImg') geoRefImg: ElementRef<HTMLImageElement>;
  @ViewChild('scale-line-customes') scaleLine: ElementRef;

  private currentMiniMap: OlMap;
  listenerMiniMap: any;
  currentLayer: any = null;
  imagePointsCount = 0;
  mapPointsCount = 0;
  overAllGeoRefMarkerPointsCounter = 0;
  listenerMainMap: any;
  watchOnPointChanges: Subject<any> = new Subject<any>();
  watchOnPointChangesSubs: Subscription;
  imgURL;
  imageData;
  isGeorefDoneWithTwoPoints = false;
  affinTransParams = {
    matrix : [1, 0, 0, 0, 1, 0],
    hasControlPoints : false,
    similarity : false,
    rotation : undefined,
    scaling : undefined,
    transformation : undefined
  };
  showGeorefSuggestion = true;
  showGeorefConfirmDeletePoint = false;
  selectedPoint: GeoRefPoints;
  selectedPointIndex: number;
  showManualCoordsCollectScreen = false;
  georefManualPointType = 'xy';
  manualPoint: any = {};
  manualPointErrMsg = '';
  opacityToolLayer: OlOverlay;
  @ViewChild('opacityToolContainer') opacityToolContainer: ElementRef<HTMLDivElement>;
  showGeorefLayerPreview = false;
  @ViewChild('georefLegendContainer') georefLegendContainer: ElementRef<HTMLDivElement>;
  georefLegendLayer: OlOverlay;
  cropObserverSubs: Subscription;

  maximumAllowedPoints = 9;
  validPointsCount = 0;
  croppingData;
  isCropingDoneOnMainMap = false;

  locationClickIcon = 'url(/assets/svgs/geotower/referencing_icon_white.svg) 25 45, auto';
  layerLocaInst: any = {};
  isCroppingToolON = false;
  showGeorefLegend = false;
  constructor(private commonService: CommonService, private basemapService: BasemapService,
              private georef: GeorefService) {

  }

  private _getImageDimension(image): Observable<any> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = (event) => {
        const loadedImage: any = event.currentTarget;
        image.width = loadedImage.width;
        image.height = loadedImage.height;
        observer.next(image);
        observer.complete();
      };
      img.src = image.url;
    });
  }

  ngOnInit(): void {
    console.log(this);
    for (const key in this.layerInfo) {
      if (this.layerInfo.hasOwnProperty(key)) {
        this.layerLocaInst[key] = this.layerInfo[key];
      }
    }
    console.log(this.layerLocaInst);
    const url = this.layerLocaInst.firebaseUrl;
    this.imgURL = url;
    const image = {
      url
    };
    if (this.layerLocaInst.fileType === '.jpg' || this.layerLocaInst.type === 'jpg'){
      // SHOWIMG IMAGE LAYER
      this.layerLocaInst.metadata = {};
      this._getImageDimension(image).subscribe(imageData => {
        this.imageData = imageData;
        this.imageLayerLoadingOnMiniMap(url, imageData);
        this.operationChange(this.selectedTab);
      });
    } else if (this.layerLocaInst.fileType === '.zip'){
      // SHOWING VECTOR LAYER
      const geoJsonMapshaper = this.layerLocaInst.metadata;
      if (geoJsonMapshaper.length > 0) {
        geoJsonMapshaper.forEach((jsonObj) => {
          this.setLayerToMap(jsonObj);
        });
      } else {
        this.setLayerToMap(geoJsonMapshaper);
      }
    }

  }

  /**
   * Show vector layer on mini map
   */
  private setLayerToMap(geoJson): any {
    const projection = this.basemapService.getCurrentBasemap().getView().getProjection().code_;
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson, {
        featureProjection: projection
      })
    });
    const fill = new Fill({
      color: 'rgba(255, 255, 255, 1)'
    });
    const stroke = new Stroke({
      color: '#319FD3',
      // color: this.randomRainbowColor(0, 6),
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
    vectorLayer.set('name', `GeoRef_${geoJson.fileName}`);
    vectorLayer.setVisible(true);
    setTimeout(() => {
      const basemapFactory = new BasemapFactory('openstreet');
      const mapLayer: OlTileLayer = basemapFactory.getBaseMap().getMapTileLayer();
      mapLayer.setVisible(false);
      this.currentMiniMap = new OlMap({
        target: 'miniMapView',
        layers: [mapLayer],
        view: new OlView({
          center: [0, 0],
          zoom: 2,
          projection
        })
      });
      this.currentMiniMap.addLayer(vectorLayer);

      this.currentMiniMap.getLayers().forEach(currentLayer => {
        if (`GeoRef_${geoJson.fileName}` === currentLayer.values_.name) {
          const extentValue = currentLayer.values_.source.getExtent();
          this.currentMiniMap.getView().fit(extentValue);
          this.currentMiniMap.getView().setZoom(this.currentMiniMap.getView().getZoom() - 1);
        }
      });
    }, 0);

  }



  /**
   * Show image layer on mini map
   */
  // a static image as a layer source.
  // The map view is configured with a custom projection that translates image coordinates directly into map coordinates.
  private imageLayerLoadingOnMiniMap(url, imageData): any {
    // Map views always need a projection.  Here we just want to map image
    // coordinates directly to map coordinates, so we create a projection that uses
    // the image extent in pixels.
    console.log('what is image width and height ', imageData, imageData.width, imageData.height);
    // const extent = [0, 0, imageData.width, imageData.height];
    // Here taken image center point pointing to maps 0,0 coords
    const extent = [0 - (1 * this.imageData.width / 2), 0 - (1 * this.imageData.height / 2),
      0 + (1 * this.imageData.width / 2), 0 + (1 * this.imageData.height / 2)];
    console.log('minimap extent ', extent);
    const projection = new Projection({
      code: 'orto-image',
      units: 'pixels',
      extent,
    });
    const imageLayer = new ImageLayer({
      source: new Static({
        url: this.imgURL,
        projection,
        imageExtent: extent,
        imageSize: [this.imageData.width, this.imageData.height],
        imageLoadFunction : (image) => {
          image.getImage().src = this.imgURL;
          if (image.resolution === undefined) {
            image.resolution = (image.extent[3] - image.extent[1]) / image.image_.height;
          }
          image.state = 2;
          image.unlistenImage_();
          image.changed();
        }
      })
    });
    imageLayer.set('type', 'IMAGE');
    imageLayer.set('name', `GeoRef_${this.layerLocaInst.name}`);
    imageLayer.setZIndex(1);
    this.currentMiniMap = new OlMap({
      target: 'miniMapView',
      layers: [imageLayer],
      view: new OlView({
        projection,
        center: getCenter(extent),
        zoom: 2,
      }),
    });
    this.currentMiniMap.on('contextmenu', (evt) => {
      console.log(evt);
      evt.preventDefault();
      this.georefManualPointType = 'xy';
      this.manualPointErrMsg = '';
      this.manualPoint = {
        xSource: '',
        ySource: '',
        latDeg: '',
        latMin: '',
        latSec: '',
        latDirection: 'E',
        longDeg: '',
        longMin: '',
        longSec: '',
        longDirection: 'N'
      };
      this.showManualCoordsCollectScreen = true;
    });
    this.currentMiniMap.getLayers().forEach(currentLayer => {
      if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
        console.log(currentLayer);
        console.log(currentLayer.getZIndex());
        const extentValue = currentLayer.values_.source.getImageExtent();
        this.currentMiniMap.getView().fit(extentValue);
      }
    });
    // This code for removing the Raster Layer from 0,0 coords from main map
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (currentLayer !== undefined) {
        if ((this.layerLocaInst.name === currentLayer.values_.name) && !this.layerLocaInst.isServer) {
          console.log(currentLayer);
          this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
        }
      }
    });
    // if (this.viewMode === 'georef'){
    //   console.log('GEOREF MODE DISAPLYED. MONITORING CLICKS.');
    //   this.monitorAllPointChanges();
    //   this.monitorMiniMapClicks();
    //   this.monitorMainMapClicks();
    // } else {
    //   console.log('ONLY PREVIEW MODE DISAPLYED.');
    // }
  }

  operationChange(op): void{
    this.selectedTab = op;
    let validPointsCount = 0;
    this.geoRefPoints.forEach(point => {
      if (this.commonService.isValid(point.xSource) && this.commonService.isValid(point.xMapOrLatitude)){
        validPointsCount++;
      }
    });
    this.validPointsCount = validPointsCount;

    if (op === 'geo-ref'){
      if (validPointsCount < this.maximumAllowedPoints){
        this.activateGeoRefTools();
      }
      this.deActivateCroppingTool();
    } else if (op === 'crop'){
      this.deActivateGeoRefTools('click');
      this.activateCroppingTool();
    } else {
      this.deActivateGeoRefTools();
      this.deActivateCroppingTool();
    }
  }

  activateGeoRefTools(): void{
    this.isCroppingToolON = false;
    console.log('ACTIVATING GEOREF TOOLS');
    // this.showGeorefSuggestion = true;
    if (this.viewMode === 'georef'){
      console.log('GEOREF MODE DISAPLYED. MONITORING CLICKS.');
      this.monitorAllPointChanges();
      this.monitorMiniMapClicks();
      this.monitorMainMapClicks();
    } else {
      console.log('ONLY PREVIEW MODE DISAPLYED.');
    }
  }

  deActivateGeoRefTools(disable = 'all'): void{
    console.log('DE-ACTIVATING GEOREF TOOLS', disable);
    this.deActivateCroppingTool();
    if (disable === 'all'){
      this.removeAllPoints();
      if (this.watchOnPointChangesSubs){
        this.watchOnPointChangesSubs.unsubscribe();
      }
    }
    if (this.listenerMiniMap){
      unByKey(this.listenerMiniMap);
      this.listenerMiniMap = null;
    }
    if (this.listenerMainMap){
      unByKey(this.listenerMainMap);
      this.listenerMainMap = null;
    }
  }

  activateCroppingTool(): void{
    this.isCroppingToolON = true;
    console.log('Activate cropping tool');
    const cropObserver: Subject<any> = new Subject<any>();
    this.cropObserverSubs = cropObserver.subscribe(res => {
      console.log(res);
      const data = {
        features: res.features,
        name: 'georef_cropping_tool'
      };
      console.log(data);
      this.georef.redrawCroppingArea(data);
      this.croppingData = res;
      this.cropingImageOnMainMap();
    });
    this.georef.activateCroppingTool(this.currentMiniMap, cropObserver);
  }

  deActivateCroppingTool(): void{
    this.isCroppingToolON = false;
    console.log('De-activate cropping tool');
    if (this.commonService.isValid(this.cropObserverSubs)){
      this.cropObserverSubs.unsubscribe();
    }
    this.georef.deActivateCroppingTool(this.currentMiniMap);
  }

  ngAfterViewInit(): void {
  }

  zoomIn(): void{
    console.log('zoomIn');
    const currentZoom = this.currentMiniMap.getView().getZoom();
    const maxZoom = this.currentMiniMap.getView().getMaxZoom();
    if (currentZoom < maxZoom) {
      this.currentMiniMap.getView().setZoom(this.currentMiniMap.getView().getZoom() + 1);
    }
  }

  zoomOut(): void{
    console.log('zoomOut');
    const currentZoom = this.currentMiniMap.getView().getZoom();
    const minZoom = this.currentMiniMap.getView().getMinZoom();
    if (currentZoom > minZoom) {
      this.currentMiniMap.getView().setZoom(this.currentMiniMap.getView().getZoom() - 1);
    }
  }

  monitorAllPointChanges(): void{
    if (this.watchOnPointChangesSubs){
      return;
    }
    this.watchOnPointChangesSubs = this.watchOnPointChanges.subscribe(polygonChanged => {
      /* console.log('POLYGON CHANGED');
      console.log(polygonChanged); */
      const layerName = polygonChanged.name;
      const coords = polygonChanged['co-ordinates'];
      const type = layerName.split('_')[0];
      const pointNum = layerName.split('_')[1];
      // coords = [Longitude, Latitude]
      if (type === 'GeorefMiniMapPoint'){
        // console.log('Mini map point changed.');

        // Here chanded the coords order and disable pixcels from coordinates
        const coord = [coords[0]/*.toFixed(2)*/, coords[1]/*.toFixed(2)*/];
        // console.log('Coordinates', coord);
        const pixcels = coord; // this.currentMiniMap.getPixelFromCoordinate(coord);
        /* console.log(pixcels);
        console.log(this.currentMiniMap);
        console.log(this.currentMiniMap.getCoordinateFromPixel(pixcels)); */
        // this.addGeorefPoint('image', {xSource: pixcels[0]/*.toFixed(2)*/, ySource: pixcels[1]/*.toFixed(2)*/});
        const index = this.geoRefPoints.findIndex(val => Number(val.link) === Number(pointNum));
        // console.log(index);
        if (index !== -1){
          this.geoRefPoints[index].xSource = pixcels[0];
          this.geoRefPoints[index].ySource = pixcels[1];
          // this.redrawPoint(this.currentMiniMap, 'image', index);
          this.checkToAllowTransformation();
        }

      } else if (type === 'GeorefMainMapPoint'){
        // console.log('Main map point changed.');
        const index = this.geoRefPoints.findIndex(val => Number(val.link) === Number(pointNum));
        // console.log(index);
        if (index !== -1){
          this.geoRefPoints[index].xMapOrLatitude = coords[1];
          this.geoRefPoints[index].yMapOrLongitude = coords[0];
          // this.redrawPoint(this.basemapService.getCurrentBasemap(), addFor, this.geoRefPoints.length - 1);
          this.checkToAllowTransformation();
        }

      }

    });
  }

  monitorMiniMapClicks(): void{
    if (this.listenerMiniMap){
      return;
    }
    this.listenerMiniMap = this.currentMiniMap.on('click', (evt) => {
      console.log(evt);
      // evt.coordinate order is [Longitude, Latitude]
      const coord = [evt.coordinate[1], evt.coordinate[0]];
      const pixcels = this.currentMiniMap.getPixelFromCoordinate(coord);
      console.log('Coordinates && pixcels ', coord, pixcels);
      // Here taking only coordinates not pixcels
      this.addGeorefPoint('image', {xSource: coord[1], ySource: coord[0]});
    });
  }

  monitorMainMapClicks(): void{
    if (this.listenerMainMap){
      return;
    }
    this.listenerMainMap = this.basemapService.getCurrentBasemap().on('click', (evt) => {
      const coord = [evt.coordinate[1], evt.coordinate[0]];
      this.addGeorefPoint('map', {xMapOrLatitude: coord[0], yMapOrLongitude: coord[1]});
    });
  }


  /**
   * Function to close manual point window
   */
  closeManualPointWindow(): void{
    this.showManualCoordsCollectScreen = false;
    this.manualPointErrMsg = '';
    this.manualPoint = {};
  }

  /**
   * Function to save manual point data
   */
  saveManualPoint(): void{
    console.log('IN saveManualPoint');
    console.log(this.manualPoint);
    this.manualPointErrMsg = '';
    // lt deg lessthan 18000
    // lat min lessthan 6000
    // lat sec lessthan

    // long deg lessthan 18000
    // long min lessthan 60

    // Decimal Degrees = degrees + (minutes/60) + (seconds/3600)
    // DD = d + (min/60) + (sec/3600)

    let errorFound = false;

    try{
      if (!this.commonService.isValid(this.manualPoint.xSource)){
        throw new Error('Please enter X value');
      } else if (!this.commonService.isValid(this.manualPoint.ySource)){
        throw new Error('Please enter Y value');
      }
      if (!this.commonService.isValid(this.manualPoint.latDeg)){
        throw new Error('Please enter latitude degree value');
      }/* else {
        if (Number(this.manualPoint.latDeg) > 18000 || Number(this.manualPoint.latDeg) < -18000){
          throw new Error('Latitude degree value should be between -18000 to 18000');
        }
      }*/
      // if (this.commonService.isValid(this.manualPoint.latMin)){
      //   if (Number(this.manualPoint.latMin) > 6000 || Number(this.manualPoint.latMin) < -6000){
      //     throw new Error('Longitude minutes value should be between -6000 to 6000');
      //   }
      // }
      if (!this.commonService.isValid(this.manualPoint.longDeg)){
        throw new Error('Please enter longitude degree value');
      }/* else {
        if (Number(this.manualPoint.longDeg) > 18000 || Number(this.manualPoint.longDeg) < -18000){
          throw new Error('Longitude degree value should be between -18000 to 18000');
        }
      }*/
      // if (this.commonService.isValid(this.manualPoint.longMin)){
      //   if (Number(this.manualPoint.longMin) > 60 || Number(this.manualPoint.longMin) < -60){
      //     throw new Error('Longitude minutes value should be between -60 to 60');
      //   }
      // }
    } catch (e){
      this.manualPointErrMsg = e;
      errorFound = true;
    }
    if (!errorFound){
      console.log('SAVE MANUAL POINT');
      const latitude = Number(this.manualPoint.latDeg) +
                      (Number(this.manualPoint.latMin || 0) / 60) +
                      (Number(this.manualPoint.latSec || 0) / 3600);
      const longitude = Number(this.manualPoint.longDeg) +
                      (Number(this.manualPoint.longMin || 0) / 60) +
                      (Number(this.manualPoint.longSec || 0) / 3600);


      this.geoRefPoints.push({
        link: ++this.overAllGeoRefMarkerPointsCounter, // this.geoRefPoints.length + 1,
        xSource: this.manualPoint.xSource,
        xSourceViewMode: true,
        ySource: this.manualPoint.ySource,
        ySourceViewMode: true,
        xMapOrLatitude: String(latitude),
        xMapOrLatitudeViewMode: true,
        yMapOrLongitude: String(longitude),
        yMapOrLongitudeViewMode: true,
        xMapOrLatitudeInitial: '',
        yMapOrLongitudeInitial: '',
        residualX: '',
        residualY: '',
        residual: ''
      });
      console.log(this.geoRefPoints);
      this.imagePointsCount++;
      this.addNewPoint(this.currentMiniMap, 'image', this.geoRefPoints.length - 1);
      this.addNewPoint(this.basemapService.getCurrentBasemap(), 'map', this.geoRefPoints.length - 1);
      this.closeManualPointWindow();
    }

  }


  /**
   * Function to save change point data in table
   */
  pointDataChanged(point: GeoRefPoints, changeFrom, i): void{
    console.log('In pointDataChanged');
    console.log(point);
    console.log(changeFrom);
    console.log(i);
    if (changeFrom === 'xSource'){
      point.xSourceViewMode = true;
    }
    if (changeFrom === 'ySource'){
      point.ySourceViewMode = true;
    }
    if (changeFrom === 'xMapOrLatitude'){
      point.xMapOrLatitudeViewMode = true;
    }
    if (changeFrom === 'yMapOrLongitude'){
      point.yMapOrLongitudeViewMode = true;
    }

    if (changeFrom === 'xSource' || changeFrom === 'ySource'){
      console.log('REDRAW MINI MAP POINT');
      this.redrawPoint(this.currentMiniMap, 'image', i);
    } else if (changeFrom === 'xMapOrLatitude' || changeFrom === 'yMapOrLongitude'){
      console.log('REDRAW MAIN MAP POINT');
      this.redrawPoint(this.basemapService.getCurrentBasemap(), 'map', i);
    }

  }

  addGeorefPoint(addFor, data): void{
    if (addFor === 'image'){
      if (this.imagePointsCount > this.mapPointsCount) {
        // Already marked point for Image. Get recent point and update the point details.
        // console.log('Already marked point for Image. Get recent point and update the point details.');
        this.geoRefPoints[this.geoRefPoints.length - 1].xSource = data.xSource;
        this.geoRefPoints[this.geoRefPoints.length - 1].ySource = data.ySource;
        this.redrawPoint(this.currentMiniMap, addFor, this.geoRefPoints.length - 1);
      } else if (this.imagePointsCount < this.mapPointsCount) {
        // Already marked point for Map. Get recent point and update the point details.
        // console.log('Already marked point for Map. Get recent point and update the point details.');
        this.geoRefPoints[this.geoRefPoints.length - 1].xSource = data.xSource;
        this.geoRefPoints[this.geoRefPoints.length - 1].ySource = data.ySource;
        this.redrawPoint(this.currentMiniMap, addFor, this.geoRefPoints.length - 1);
      } else if (this.imagePointsCount === this.mapPointsCount) {
        // console.log('Add new point and update the point details.');
        this.geoRefPoints.push({
          link: ++this.overAllGeoRefMarkerPointsCounter, // this.geoRefPoints.length + 1,
          xSource: data.xSource,
          xSourceViewMode: true,
          ySource: data.ySource,
          ySourceViewMode: true,
          xMapOrLatitude: '',
          xMapOrLatitudeViewMode: true,
          yMapOrLongitude: '',
          yMapOrLongitudeViewMode: true,
          xMapOrLatitudeInitial: '',
          yMapOrLongitudeInitial: '',
          residualX: '',
          residualY: '',
          residual: ''
        });
        this.imagePointsCount++;
        this.addNewPoint(this.currentMiniMap, addFor, this.geoRefPoints.length - 1);
        // console.log(this.currentMiniMap.getLayers());
      }

    } else if (addFor === 'map'){
      if (this.mapPointsCount > this.imagePointsCount) {
        // Already marked point for Map. Get recent point and update the point details.
        // console.log('Already marked point for Map. Get recent point and update the point details.');
        this.geoRefPoints[this.geoRefPoints.length - 1].xMapOrLatitude = data.xMapOrLatitude;
        this.geoRefPoints[this.geoRefPoints.length - 1].yMapOrLongitude = data.yMapOrLongitude;
        this.redrawPoint(this.basemapService.getCurrentBasemap(), addFor, this.geoRefPoints.length - 1);
      } else if (this.mapPointsCount < this.imagePointsCount) {
        // Already marked point for Image. Get recent point and update the point details.
        // console.log('Already marked point for Image. Get recent point and update the point details.');
        this.geoRefPoints[this.geoRefPoints.length - 1].xMapOrLatitude = data.xMapOrLatitude;
        this.geoRefPoints[this.geoRefPoints.length - 1].yMapOrLongitude = data.yMapOrLongitude;
        this.geoRefPoints[this.geoRefPoints.length - 1].xMapOrLatitudeInitial = data.xMapOrLatitude;
        this.geoRefPoints[this.geoRefPoints.length - 1].yMapOrLongitudeInitial = data.yMapOrLongitude;
        this.redrawPoint(this.basemapService.getCurrentBasemap(), addFor, this.geoRefPoints.length - 1);
      } else if (this.mapPointsCount === this.imagePointsCount) {
        // Add new point and update the point details.
        // console.log('Add new point and update the point details.');
        this.geoRefPoints.push({
          link: ++this.overAllGeoRefMarkerPointsCounter, // this.geoRefPoints.length + 1,
          xSource: '',
          xSourceViewMode: true,
          ySource: '',
          ySourceViewMode: true,
          xMapOrLatitude: data.xMapOrLatitude,
          xMapOrLatitudeViewMode: true,
          yMapOrLongitude: data.yMapOrLongitude,
          yMapOrLongitudeViewMode: true,
          xMapOrLatitudeInitial: data.xMapOrLatitude,
          yMapOrLongitudeInitial: data.yMapOrLongitude,
          residualX: '',
          residualY: '',
          residual: ''
        });
        this.mapPointsCount++;
        this.addNewPoint(this.basemapService.getCurrentBasemap(), addFor, this.geoRefPoints.length - 1);
      }
    }
    // console.log(this.geoRefPoints);
  }

  removePoint(point: GeoRefPoints, askConfirm = false): void{
    /* console.log('Removing point');
    console.log(point); */
    this.selectedPoint = point;
    const index = this.geoRefPoints.findIndex(val => val.link === point.link);
    this.selectedPointIndex = index + 1;
    if (!askConfirm){
      this.deleteSelectedPoint();
    } else {
      this.showGeorefConfirmDeletePoint = true;
    }
  }

  deleteSelectedPoint(): void{
    const point: GeoRefPoints = this.selectedPoint;
    if (this.commonService.isValid(point.xSource)){
      this.georef.removeFeatureOnMap(this.currentMiniMap, `GeorefMiniMapPoint_${point.link}`);
      this.imagePointsCount--;
    }
    if (this.commonService.isValid(point.xMapOrLatitude)){
      this.georef.removeFeatureOnMap(this.basemapService.getCurrentBasemap(), `GeorefMainMapPoint_${point.link}`);
      this.georef.removeFeatureOnMap(this.basemapService.getCurrentBasemap(), `GeorefMainMapResidualPoint_${point.link}`);
      this.mapPointsCount--;
    }
    const index = this.geoRefPoints.findIndex(val => Number(val.link) === Number(point.link));
    if (index !== -1){
      this.geoRefPoints.splice(index, 1);
    }
    /* console.log(this.geoRefPoints);
    console.log(this.imagePointsCount);
    console.log(this.mapPointsCount); */
    this.checkToAllowTransformation();
    this.showGeorefConfirmDeletePoint = false;
    this.renameAllPoints();
  }

  /**
   * Function to rename all points with their numbers
   */
  renameAllPoints(): void{
    for (const key in this.geoRefPoints) {
      if (this.geoRefPoints.hasOwnProperty(key)) {
        const element = this.geoRefPoints[key];
        console.log(key);
        console.log(element);
        this.currentMiniMap.getLayers().forEach(layerObj => {
          if (layerObj !== undefined) {
            const layerName = `GeorefMiniMapPoint_${element.link}`;
            if (layerObj.values_.name === layerName) {
              this.georef.redrawTextOnPoint(layerObj, Number(key) + 1);
            }
          }
        });
        this.basemapService.getCurrentBasemap().getLayers().forEach(layerObj => {
          if (layerObj !== undefined) {
            const layerName = `GeorefMainMapPoint_${element.link}`;
            if (layerObj.values_.name === layerName) {
              this.georef.redrawTextOnPoint(layerObj, Number(key) + 1);
            }
          }
        });
      }
    }
  }

  addNewPoint(mapRef, addFor, pointIndex): void{
    /* console.log(`addNewPoint: ${addFor}, ${pointIndex}`);
    console.log(this); */
    const point: GeoRefPoints = this.geoRefPoints[pointIndex];
    /* console.log(mapRef);
    console.log(this.currentLayer); */
    let longitude: number;
    let latitude: number;
    let layerName = '';
    if (addFor === 'image'){
      // here no need getCoordinateFromPixel becuse we not using pixcels
      const coords = [point.xSource, point.ySource]; // this.currentMiniMap.getCoordinateFromPixel([point.xSource, point.ySource]);
      // coords = [Latitude, Longitude]
      // console.log(coords);
      longitude = Number(coords[0]);
      latitude = Number(coords[1]);
      layerName = `GeorefMiniMapPoint_${point.link}`;
    } else if (addFor === 'map'){
      const coords = [Number(point.xMapOrLatitude), Number(point.yMapOrLongitude)];
      // console.log(coords);
      longitude = coords[1];
      latitude = coords[0];
      layerName = `GeorefMainMapPoint_${point.link}`;
    }
    if (this.isGeorefDoneWithTwoPoints) {
      const transformation = new AffineTransformation();
      console.log('already geo-ref done... so Here need to synch mini & main maps if click on any map');
      console.log('affine transformation giving transform data');
      console.log('testing affine method matrix data ', this.affinTransParams.matrix);
      if (addFor === 'image') {
        transformation.matrix = this.affinTransParams.matrix;
        transformation.a_ = this.affinTransParams.rotation;
        transformation.sc_ = this.affinTransParams.scaling;
        transformation.tr_ = this.affinTransParams.transformation;
        transformation.hasControlPoints = true;
        // we need add point in both maps
        // 1st point is minimap and 2nd method calling for main map
        this.addNewPointToMap(longitude, latitude, layerName, mapRef, pointIndex);
        const returnPoints = transformation.transform([longitude, latitude]);
        console.log('clicked on mini map & returned data ', returnPoints);
        const generatedPoints = transform([returnPoints[0], returnPoints[1]], 'EPSG:3857', 'EPSG:4326');
        layerName = `GeorefMainMapPoint_${point.link}`;
        mapRef = this.basemapService.getCurrentBasemap();
        console.log('floting the points at ', generatedPoints);
        this.addNewPointToMap(generatedPoints[0], generatedPoints[1], layerName, mapRef, pointIndex);
        // TODO - update the table with main map points
        // TODO - do affine transformation and update the images on maps
        this.geoRefPoints[this.geoRefPoints.length - 1].xMapOrLatitude = generatedPoints[1];
        this.geoRefPoints[this.geoRefPoints.length - 1].yMapOrLongitude = generatedPoints[0];
        this.geoRefPoints[this.geoRefPoints.length - 1].xMapOrLatitudeInitial = generatedPoints[1];
        this.geoRefPoints[this.geoRefPoints.length - 1].yMapOrLongitudeInitial = generatedPoints[0];
        /* this.geoRefPoints.push({
          link: ++this.overAllGeoRefMarkerPointsCounter, // this.geoRefPoints.length + 1,
          xSource: '',
          ySource: '',
          xMapOrLatitude: generatedPoints[1],
          yMapOrLongitude: generatedPoints[0],
          xMapOrLatitudeInitial: generatedPoints[1],
          yMapOrLongitudeInitial: generatedPoints[0],
          residualX: '',
          residualY: '',
          residual: ''
        });
        this.mapPointsCount++; */
        this.mapPointsCount++;
        this.checkToAllowTransformation();
      } else {
        transformation.matrix = this.affinTransParams.matrix;
        // we need add point in both maps
        // 1st point is minimap and 2nd method calling for main map
        this.addNewPointToMap(longitude, latitude, layerName, mapRef, pointIndex);
        const inpuPoints = transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');
        const returnPoints = transformation.revers(inpuPoints);
        console.log('clicked on main maps & returned data ', returnPoints);
        layerName = `GeorefMiniMapPoint_${point.link}`;
        mapRef = this.currentMiniMap;
        console.log('floting the points at ', returnPoints);
        this.addNewPointToMap(returnPoints[0], returnPoints[1], layerName, mapRef, pointIndex);
        // TODO - update the table with mini map points
        // TODO - do affine transformation and update the images on maps
        this.geoRefPoints[this.geoRefPoints.length - 1].xSource = returnPoints[0];
        this.geoRefPoints[this.geoRefPoints.length - 1].ySource = returnPoints[1];
        /* this.geoRefPoints.push({
          link: ++this.overAllGeoRefMarkerPointsCounter, // this.geoRefPoints.length + 1,
          xSource: returnPoints[0],
          ySource: returnPoints[1],
          xMapOrLatitude: '',
          yMapOrLongitude: '',
          xMapOrLatitudeInitial: '',
          yMapOrLongitudeInitial: '',
          residualX: '',
          residualY: '',
          residual: ''
        });
        this.imagePointsCount++; */
        this.imagePointsCount++;
        this.checkToAllowTransformation();
      }
    } else {
      this.addNewPointToMap(longitude, latitude, layerName, mapRef, pointIndex);
      this.checkToAllowTransformation();
    }
    console.log(this.geoRefPoints);
  }
  addNewPointToMap(longitude, latitude, layerName, mapRef, pointIndex): any {
    const geometryData = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: {}
        }]
      },
      name: layerName,
      pointNum: String(pointIndex + 1)
    };
    // console.log(data);
    this.georef.drawPointOnMap(mapRef, data, 'Point', this.watchOnPointChanges, 'circle', 'red');
    // this.checkToAllowTransformation();
  }

  redrawPoint(mapRef, addFor, pointIndex): void{
    console.log(`redrawPoint: ${addFor}, ${pointIndex}`);
    // console.log(mapRef);
    // console.log(this);
    const point: GeoRefPoints = this.geoRefPoints[pointIndex];
    console.log(JSON.stringify(point));
    let layerName = '';
    let longitude: number;
    let latitude: number;
    if (addFor === 'image'){
      const coords = [point.xSource, point.ySource]; // this.currentMiniMap.getCoordinateFromPixel([point.xSource, point.ySource]);
      // coords = [Latitude, Longitude]
      // console.log(coords);
      // longitude = Number(coords[1]);
      // latitude = Number(coords[0]);
      longitude = Number(coords[0]);
      latitude = Number(coords[1]);
      layerName = `GeorefMiniMapPoint_${point.link}`;
    } else {
      const coords = [Number(point.xMapOrLatitude), Number(point.yMapOrLongitude)];
      // console.log(coords);
      longitude = coords[1];
      latitude = coords[0];
      layerName = `GeorefMainMapPoint_${point.link}`;
    }
    /* if (this.isGeorefDoneWithTwoPoints) {
      const transformation = new AffineTransformation();
      console.log('already geo-ref done... so Here need to synch mini & main maps if click on any map');
      console.log('affine transformation giving transform data');
      if (addFor === 'image') {
        console.log('clicked on mini map ', transformation.transform([latitude, longitude]));
      } else {
        console.log('clicked on main maps ', transformation.revers([latitude, longitude]));
      }
    } */
    const geometryData = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: {}
        }]
      },
      name: layerName,
      pointNum: String(pointIndex + 1)
    };
    // console.log(data);

    let layerFound = false;
    mapRef.getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        if (layerObj.values_.name === layerName) {
          layerFound = true;
          this.georef.redrawPoint(mapRef, layerObj, data, 'Point', this.watchOnPointChanges);
        }
      }
    });
    if (!layerFound){
      if (addFor === 'image'){
        this.imagePointsCount++;
      } else {
        this.mapPointsCount++;
      }
      this.georef.drawPointOnMap(mapRef, data, 'Point', this.watchOnPointChanges, 'circle', 'red');
    }
    this.checkToAllowTransformation();
  }

  checkToAllowTransformation(): void{
    /* console.log('checkToAllowTransformation');
    console.log(this.geoRefPoints); */
    this.markedPoints.emit(this.geoRefPoints.length);
    let validPointsCount = 0;
    this.geoRefPoints.forEach(point => {
      if (this.commonService.isValid(String(point.xSource)) && this.commonService.isValid(String(point.xMapOrLatitude)) ){
        validPointsCount++;
      }
    });
    if (validPointsCount >= 2){
      /* console.log('DO TRANSFORMATION..', this.geoRefPoints[0].xSource, this.geoRefPoints[0].ySource,
      this.geoRefPoints[1].xSource, this.geoRefPoints[1].ySource); */
      /* const miniMapSourcePoints = [[this.geoRefPoints[0].xSource, this.geoRefPoints[0].ySource],
      [this.geoRefPoints[1].xSource, this.geoRefPoints[1].ySource]];
      const mainmapSourcePoints = [[this.geoRefPoints[0].xMapOrLatitude, this.geoRefPoints[0].yMapOrLongitude],
      [this.geoRefPoints[1].xMapOrLatitude, this.geoRefPoints[1].yMapOrLongitude]];
      console.log('calling TRANSFORMATION..', miniMapSourcePoints, mainmapSourcePoints);
      const mainmapSourcePointsProjection = [fromLonLat([this.geoRefPoints[0].yMapOrLongitude,
         this.geoRefPoints[0].xMapOrLatitude], 'EPSG:3857'),
      fromLonLat([this.geoRefPoints[1].yMapOrLongitude, this.geoRefPoints[1].xMapOrLatitude], 'EPSG:3857')];
      console.log(miniMapSourcePoints, mainmapSourcePointsProjection); */
      // [[781.2499999999998, -277.7099609374998], [-659.1796874999999, 1742.5537109374998]]
      const miniMapSourcePoints = [];
      const mainmapSourcePoints = [];
      const mainmapSourcePointsProjection = [];

      this.geoRefPoints.forEach((points) => {
        miniMapSourcePoints.push([points.xSource, points.ySource]);
        mainmapSourcePoints.push([points.xMapOrLatitude, points.yMapOrLongitude]);
        mainmapSourcePointsProjection.push(
          fromLonLat([points.yMapOrLongitude, points.xMapOrLatitude], 'EPSG:3857')
        );
      });
      console.log('calling TRANSFORMATION..', miniMapSourcePoints, mainmapSourcePoints, mainmapSourcePointsProjection);

      const transformation = new AffineTransformation();
      transformation.setControlPoints(miniMapSourcePoints, mainmapSourcePointsProjection);
      console.log(' returning data is : ',
      ' rotation value : ', transformation.getRotation() +
      ' scaling value : ' + transformation.getScale() +
      ' transformation value : ' + transformation.getTranslation());
      // here setting the param values
      this.affinTransParams.matrix = transformation.matrix;
      this.affinTransParams.hasControlPoints = transformation.hasControlPoints;
      this.affinTransParams.rotation = transformation.getRotation();
      this.affinTransParams.scaling = transformation.getScale();
      this.affinTransParams.transformation = transformation.getTranslation();
      this.affinTransParams.similarity = transformation.similarity;

      const translationX = transformation.getTranslation()[0];
      const translationY = transformation.getTranslation()[1];
      const xScale = transformation.getScale()[0];
      const yScale = transformation.getScale()[1];
      const rotatation = transformation.getRotation();
      // rotatation = 1.201973737753634 * (180 / 3.14);

      let extent;
      let extent3857;
      const projdef = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs';
      proj4.defs('EPSG:3857', projdef);
      register(proj4);
      // affine transformation giving image center point of geo referencing
      // Here extent prepared and image displaying as image center point
      extent3857 = [translationX - (xScale * this.imageData.width / 2),
        translationY - (yScale * this.imageData.height / 2),
        translationX + (xScale * this.imageData.width / 2),
        translationY + (yScale * this.imageData.height / 2)];
      extent = transformExtent([translationX - (xScale * this.imageData.width / 2),
        translationY - (yScale * this.imageData.height / 2),
        translationX + (xScale * this.imageData.width / 2),
        translationY + (yScale * this.imageData.height / 2)],
        get('EPSG:3857'), get('EPSG:4326'));
      console.log('extent', extent, transform([translationX, translationY], 'EPSG:3857', 'EPSG:4326'));

      // extent calculated using
      // X = Ax + By + C and Y = Dx + Ey + F
      const coordinateX = (xScale * this.imageData.width) + (rotatation * this.imageData.height) + translationX;
      const coordinateY = (rotatation * this.imageData.width) + (yScale * this.imageData.height) + translationY;

      const xX = (xScale * -this.imageData.width / 2) + (rotatation * -this.imageData.height / 2) + translationX;
      const yY = (rotatation * -this.imageData.width / 2) + (yScale * -this.imageData.height / 2) + translationY;
      const xX1 = (xScale * this.imageData.width / 2) + (rotatation * this.imageData.height / 2) + translationX;
      const yY1 = (rotatation * this.imageData.width / 2) + (yScale * this.imageData.height / 2) + translationY;
      // extent = transformExtent([xX, yY, xX1, yY1], get('EPSG:3857'), get('EPSG:4326'));

      // extent calculated using cos & sin with rotation
      const coordinateX1 = (xScale * Math.cos(rotatation) * this.imageData.width / 2) -
       ( yScale * Math.sin(rotatation) * this.imageData.height / 2) + translationX;
      const coordinateY1 = (xScale * Math.cos(rotatation) * this.imageData.width / 2) -
      ( yScale * Math.sin(rotatation) * this.imageData.height / 2) + translationY;
      const coordinateX11 = (xScale * Math.cos(rotatation) * -this.imageData.width / 2) -
       ( yScale * Math.sin(rotatation) * -this.imageData.height / 2) + translationX;
      const coordinateY12 = (xScale * Math.cos(rotatation) * -this.imageData.width / 2) -
      ( yScale * Math.sin(rotatation) * -this.imageData.height / 2) + translationY;
      // extent = transformExtent([coordinateX11, coordinateY12, coordinateX1, coordinateY1], get('EPSG:3857'), get('EPSG:4326'));
      console.log('extents -- ', extent, coordinateX, coordinateY,
      transform([coordinateX, coordinateY], 'EPSG:3857', 'EPSG:4326'),
      coordinateX1, coordinateY1,
      transform([coordinateX1, coordinateY1], 'EPSG:3857', 'EPSG:4326'),
      transform([coordinateX11, coordinateY12], 'EPSG:3857', 'EPSG:4326'),
      transform([xX, yY], 'EPSG:3857', 'EPSG:4326'),
      transform([xX1, yY1], 'EPSG:3857', 'EPSG:4326'),
      );
      // its
      /* const latestLLX = translationX + (xScale * Math.cos(rotatation) * -this.imageData.width / 2)
      - (yScale * Math.sin(rotatation) * -this.imageData.height / 2);
      const latestLLY = translationY + (xScale * Math.sin(rotatation) * -this.imageData.width / 2)
      + (yScale * Math.cos(rotatation) * -this.imageData.height / 2);
      const latestTRX = translationX + (xScale * Math.cos(rotatation) * this.imageData.width / 2)
      - (yScale * Math.sin(rotatation) * this.imageData.height / 2);
      const latestTRY = translationY + (xScale * Math.sin(rotatation) * this.imageData.width / 2)
      + (yScale * Math.cos(rotatation) * this.imageData.height / 2); */

      /* const llCC = transformation.transform([-this.imageData.width / 2, -this.imageData.height / 2]);
      const trCC = transformation.transform([this.imageData.width / 2, this.imageData.height / 2]);
      const generatedPoints = transform(llCC, 'EPSG:3857', 'EPSG:4326');
      const generatedPoints1 = transform(trCC, 'EPSG:3857', 'EPSG:4326'); */
      // extent = [generatedPoints1[0], generatedPoints1[1], generatedPoints[0], generatedPoints[1]];
      /* console.log('transformation llCC trCC ', llCC, trCC, generatedPoints, generatedPoints1, extent,
      [generatedPoints[0], generatedPoints[1], generatedPoints1[0], generatedPoints1[1]],
      transform(transformation.transform([-this.imageData.width / 2, -this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326'),
      transform(transformation.transform([this.imageData.width / 2, this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326'),
      transform(transformation.transform([this.imageData.width / 2, -this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326'),
      transform(transformation.transform([-this.imageData.width / 2, this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326'),
      transform(transformation.transform([-this.imageData.width / 2, this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326'),
      transform(transformation.transform([this.imageData.width / 2, -this.imageData.height / 2]), 'EPSG:3857', 'EPSG:4326')
      ); */

      /* translationX + (xScale * Math.cos(rotatation) * -this.imageData.width / 2) - (yScale * Math.sin(rotatation) * -this.imageData.height / 2),
        translationY + (xScale * Math.sin(rotatation) * -this.imageData.width / 2) + (yScale * Math.cos(rotatation) * -this.imageData.height / 2),
        translationX + (xScale * Math.cos(rotatation) * this.imageData.width / 2) - (yScale * Math.sin(rotatation) * this.imageData.height / 2),
        translationY + (xScale * Math.sin(rotatation) * this.imageData.width / 2) + (yScale * Math.cos(rotatation) * this.imageData.height / 2)
       */
      // const extentCoordinate = transformExtent([latestLLX, latestLLY, latestTRX, latestTRY], get('EPSG:3857'), get('EPSG:4326'));
      /* console.log('latest coordinates form calculation ', extentCoordinate, Math.cos(1.570796), -this.imageData.width / 2,
      (xScale * Math.cos(rotatation) * -this.imageData.width / 2)); */
      // extent = extentCoordinate;
      const basemapProj = this.basemapService.getCurrentBasemap().getView().getProjection();
      const viewProjection = new Projection({
        code: 'orto-image',
        units: 'pixels',
        extent: buffer(extent, 512)
      });
      const imageProjection = this.returnRotateProjection(
        'EPSG:3857',
        transformation.getRotation(),
        extent3857
      );
      /* const boundingExtent = transformExtent(
        extent,
        imageProjection,
        this.basemapService.getCurrentBasemap().getView().getProjection()
      ); */
      // console.log('boundingExtent', boundingExtent);
      /* this.basemapService.getCurrentBasemap().addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: [new Feature(fromExtent(boundingExtent))]
          }),
          style: new Style({
            stroke: new Stroke({
              color: 'blue',
              width: 2
            })
          })
        })
      ); */

      let isLayerExist = false;
      let layerObj: any = null;
      this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
        if (currentLayer !== undefined) {
          if ((this.layerLocaInst.name === currentLayer.values_.name) && this.layerLocaInst.isServer) {
            this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
          }
          if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
            isLayerExist = true;
            layerObj = currentLayer;
          }
        }
      });
      console.log(`Layer exist status: ${isLayerExist}`);

      const imgSource = new Static({
        url: this.imgURL,
        projection: imageProjection,
        imageExtent: extent3857,
        imageSize: [this.imageData.width, this.imageData.height],
        imageSmoothing: true,
        imageLoadFunction : (image) => {
          image.getImage().src = this.imgURL;
          if (image.resolution === undefined) {
            // image.resolution = (image.extent[3] - image.extent[1]) / image.image_.height;
            // image.resolution = (image.extent[3] - image.extent[1]) / image.image_.width;
            // image.resolution = getHeight(image.extent) / image.image_.height;
            image.resolution = getWidth(image.extent) / image.image_.width;
          }
          console.log('what is image resolution ', ((image.extent[3] - image.extent[1]) / image.image_.height),
          getHeight(image.extent) / image.image_.height,
          image.resolution, image.extent);
          image.state = 2; // ImageState.LOADED;
          image.unlistenImage_();
          image.changed();
        }
      });
      const topLeft = getTopLeft(extent);
      const bottomLeft = getBottomLeft(extent);
      if (isLayerExist){
        console.log('LAYER PRESENT. UPDATING SOURCE...');
        layerObj.setSource(imgSource);
        this.basemapService.getCurrentBasemap().getOverlays().forEach(currentLayer => {
          console.log(currentLayer);
          if (currentLayer.id === 'opacityTool'){
            currentLayer.setPosition(topLeft);
          } else if (currentLayer.id === 'georefLegend'){
            currentLayer.setPosition(bottomLeft);
          }
        });
      } else{
        console.log('LAYER NOT PRESENT. ADDING IMAGE...');
        const imageLayer = new ImageLayer({
          className: 'clipped',
          source: imgSource
        });
        imageLayer.set('name', `GeoRef_${this.layerLocaInst.name}`);
        imageLayer.set('type', 'IMAGE');
        imageLayer.setOpacity(0.5);
        imageLayer.setZIndex(1);
        this.basemapService.getCurrentBasemap().addLayer(imageLayer);
        this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
          if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
            console.log('image layer is ', currentLayer, imageLayer, currentLayer.values_.source);
            const extentValue = currentLayer.values_.source.getImageExtent();
            // this.basemap.getView().fit(extentValue);
          }
        });

        // this.opacityToolLayer = new OlOverlay({id: 'opacityTool', className: 'georef-opacity-tool-overlay'});
        // this.opacityToolLayer.setPosition(topLeft);
        // this.opacityToolLayer.setElement(this.opacityToolContainer.nativeElement);
        // this.opacityToolContainer.nativeElement.style.display = 'flex';
        // this.basemapService.getCurrentBasemap().addOverlay(this.opacityToolLayer);
        this.showGeorefLayerPreview = true;

        // this.georefLegendLayer = new OlOverlay({id: 'georefLegend', className: 'georef-legend-overlay'});
        // this.georefLegendLayer.setPosition(bottomLeft);
        // this.georefLegendLayer.setElement(this.georefLegendContainer.nativeElement);
        // this.georefLegendContainer.nativeElement.style.display = 'flex';
        // this.basemapService.getCurrentBasemap().addOverlay(this.georefLegendLayer);
        this.showGeorefLegend = true;
      }
      // this.cropingImageOnMainMap();

      // this.sourceImageLayerRotation(transformation.getRotation(), imageProjection, extent);
      this.isGeorefDoneWithTwoPoints = true;
      console.log(this.layerLocaInst);

      /* this.layerLocaInst.metadata.geodata = xScale + '\n' + rotatation + '\n' + rotatation + '\n' + yScale + '\n'
        + extent[0] + '\n' + extent[1]; */
      this.layerLocaInst.metadata.geodata = xScale + '\n' + rotatation + '\n' + rotatation + '\n' + yScale + '\n'
        + translationX + '\n' + translationY;
      this.layerLocaInst.metadata.extent = extent;
      this.layerLocaInst.projection = 'EPSG:3857';
      if (validPointsCount >= 3) {
        // this.calculationResidualPoints(transformation);
        this.geoRefPoints.forEach((pointData, index) => {
          console.log('point data iterating ', pointData, index);
          const coords = [pointData.xSource, pointData.ySource];
          const longitude = Number(coords[0]);
          const latitude = Number(coords[1]);
          const returnPoints = transformation.transform([longitude, latitude]);
          console.log('clicked on mini map & returned data ', returnPoints);
          const generatedPoints = transform([returnPoints[0], returnPoints[1]], 'EPSG:3857', 'EPSG:4326');
          const layerName = `GeorefMainMapResidualPoint_${pointData.link}`;
          // const layerName = `GeorefMainMapResidualPoint_`;
          const mapRef = this.basemapService.getCurrentBasemap();
          console.log('floting the points at ', generatedPoints, this.geoRefPoints[index].xMapOrLatitude, generatedPoints[1],
          this.geoRefPoints[index].yMapOrLongitude, generatedPoints[0]);
          console.log(Number(this.geoRefPoints[index].xMapOrLatitude) - Number(generatedPoints[1]));
          this.removeResidualPointsFromMainMap(layerName);
          // setTimeout(() => {
          this.findResidual_AddToMap(generatedPoints[1], generatedPoints[0], layerName, mapRef, index);
          /* this.geoRefPoints[index].residualX = generatedPoints[1];
          this.geoRefPoints[index].residualY = generatedPoints[0]; */
          const residualX: any = Number(this.geoRefPoints[index].xMapOrLatitude) - Number(generatedPoints[1]);
          const residualY: any = Number(this.geoRefPoints[index].yMapOrLongitude) - Number(generatedPoints[0]);
          this.geoRefPoints[index].residualX = residualX.toFixed(20);
          this.geoRefPoints[index].residualY = residualY.toFixed(20);
        });
      }

    }

    if (validPointsCount >= this.maximumAllowedPoints && !this.isCroppingToolON){
      this.deActivateGeoRefTools('click');
    } else if (validPointsCount < this.maximumAllowedPoints && !this.isCroppingToolON){
      this.activateGeoRefTools();
    }
    this.validPointsCount = validPointsCount;
    // this.cropingImageOnMainMap();
  }

  calculationResidualPoints(transformation): any {
    this.geoRefPoints.forEach((pointData, index) => {
      console.log('point data iterating ', pointData, index);
      const coords = [pointData.xSource, pointData.ySource];
      const longitude = Number(coords[0]);
      const latitude = Number(coords[1]);
      const returnPoints = transformation.transform([longitude, latitude]);
      console.log('clicked on mini map & returned data ', returnPoints);
      const generatedPoints = transform([returnPoints[0], returnPoints[1]], 'EPSG:3857', 'EPSG:4326');
      const layerName = `GeorefMainMapResidualPoint_${pointData.link}`;
      // const layerName = `GeorefMainMapResidualPoint_`;
      const mapRef = this.basemapService.getCurrentBasemap();
      console.log('floting the points at ', generatedPoints, this.geoRefPoints[index].xMapOrLatitude, generatedPoints[1],
      this.geoRefPoints[index].yMapOrLongitude, generatedPoints[0]);
      this.removeResidualPointsFromMainMap(layerName);
      // setTimeout(() => {
      this.findResidual_AddToMap(generatedPoints[1], generatedPoints[0], layerName, mapRef, index);
      /* this.geoRefPoints[index].residualX = generatedPoints[1];
      this.geoRefPoints[index].residualY = generatedPoints[0]; */
      const residualX: any = Number(this.geoRefPoints[index].xMapOrLatitude) - generatedPoints[1];
      const residualY: any = Number(this.geoRefPoints[index].yMapOrLongitude) - generatedPoints[0];
      this.geoRefPoints[index].residualX = residualX;
      this.geoRefPoints[index].residualY = residualY;
    });
  }

  removeResidualPointsFromMainMap(layerName): any {
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      // console.log(layerName, ' === ', currentLayer);
      if (currentLayer !== undefined) {
        if (layerName === currentLayer.values_.name) {
          this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
        }
      }
    });
  }

  findResidual_AddToMap(latitude, longitude, layerName, mapRef, pointIndex): any {
    this.layerLocaInst.metadata.georefPointsData = this.geoRefPoints;
    const geometryData = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: geometryData,
          properties: {}
        }]
      },
      name: layerName,
      pointNum: String(pointIndex + 1)
    };
    // console.log(data);
    this.georef.drawPointOnMap(mapRef, data, 'Point', null, 'square', 'green');
    // this.checkToAllowTransformation();
  }



  /**
   * Function to change georef image layer opacity
   */
  changeGeorefImageOpacity(event): void{
    console.log('In changeGeorefImageOpacity');
    console.log(event);
    console.log(event.target.value);
    const val = event.target.value;
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
        console.log(currentLayer);
        currentLayer.setOpacity(val / 100);
      }
    });
  }

  /**
   * Function to toggle georef image layer view
   */
  toggleGeorefLayerPreview(): void{
    console.log('In toggleGeorefLayerPreview');
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
        console.log(currentLayer);
        this.showGeorefLayerPreview = !this.showGeorefLayerPreview;
        currentLayer.setVisible(this.showGeorefLayerPreview);
      }
    });
  }

  sourceImageLayerRotation(rotationValue, projection, extent): any {
    // Need to work on it...
    const viewProjection = this.currentMiniMap.getView().getProjection();
    // this.currentMiniMap.getView().setRotation(rotationValue);
  }

  removeAllPoints(): void{
    const tempPoints: Array<GeoRefPoints> = [];
    this.geoRefPoints.forEach(point => {
      tempPoints.push(point);
    });
    for (const point of tempPoints) {
      this.removePoint(point);
    }
  }

  ngOnDestroy(): void{
    this.clearAll();
  }

  clearAll(): void{
    this.deActivateGeoRefTools();
    this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (currentLayer !== undefined) {
        if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
          console.log(currentLayer);
          const extentValue = currentLayer.values_.source.getImageExtent();
          this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
          // try {
          //   this.basemapService.getCurrentBasemap().removeOverlay(this.opacityToolLayer);
          // } catch (e) {
          //   console.log(e);
          // }
          // try {
          //   this.basemapService.getCurrentBasemap().removeOverlay(this.georefLegendLayer);
          // } catch (e) {
          //   console.log(e);
          // }
          this.showGeorefLegend = false;
        }
        if (`polygonLayer` === currentLayer.values_.name) {
          this.basemapService.getCurrentBasemap().removeLayer(currentLayer);
        }
      }
    });
  }

  saveRefInfo(): void{
    if (this.isGeorefDoneWithTwoPoints) {
      // here sending the layerinfo data save into database
      console.log('final saving data is ', this.layerLocaInst);
      // this.basemapService.setSaveGeorefLayerDataToTower(this.layerLocaInst);
      // this.clearAll();
      this.saveGeorefInfo.emit(this.layerLocaInst);
      this.clearAll();
      console.log('sent data is ', this.layerLocaInst);
    } else {
      alert('Please complete the Georef and save again');
    }

  }

  returnRotateProjection(projection, rotation, extent): any {
    // console.log('values are ', viewProjection, transformation, rotation, extent);
    // Its temp value.. i need to change to back
    console.log('changed to hard coded value ', rotation, rotation * (180 / Math.PI));
    // rotation = rotation * (180 / Math.PI);
    projection = 'EPSG:3857';
    const normalProjection = get('EPSG:4326');
    const rotatedProjection = new Projection({
      code: normalProjection.getCode() + ':' + rotation.toString() + ':' + extent.toString(),
      units: normalProjection.getUnits(),
      extent
    });
    addProjection(rotatedProjection);
    addCoordinateTransforms(
      'EPSG:4326',
      rotatedProjection,
      coordinate => {
        return this.rotateTransform(transform(coordinate, 'EPSG:4326', 'EPSG:3857'), rotation, extent);
        // return this.rotateTransform(coordinate, rotation, extent);
      },
      coordinate => {
        return this.normalTransform(transform(coordinate, 'EPSG:3857', 'EPSG:4326'), rotation, extent);
      }
    );
    addCoordinateTransforms(
      'EPSG:3857',
      rotatedProjection,
      coordinate => {
        return this.rotateTransform(transform(coordinate, 'EPSG:3857', 'EPSG:4326'), rotation, extent);
      },
      coordinate => {
        return transform(this.normalTransform(coordinate, rotation, extent), 'EPSG:4326', 'EPSG:3857');
      }
    );
    console.log('projection value ', proj4);
    if (typeof proj4 !== 'undefined') {
      const projCodes = Object.keys(proj4.defs);
      projCodes.forEach((code) => {
        console.log('what is this code inside ,', projCodes, code, projection);
        const proj4Projection = get(code);
        if (!getTransform(proj4Projection, rotatedProjection)) {
          addCoordinateTransforms(
            proj4Projection,
            rotatedProjection,
            (coordinate) => {
              return this.rotateTransform(
                transform(coordinate, proj4Projection, projection), rotation, extent);
            },
            (coordinate) => {
              return transform(
                this.normalTransform(coordinate, rotation, extent), projection, proj4Projection);
            }
          );
        }
      });
    }
    return rotatedProjection;
  }
  rotateTransform(coordinate, rotation, extent): any {
    // console.log('what is inside RT ', coordinate, rotation, getCenter(extent));
    return this.rotateCoordinate(coordinate, rotation, getCenter(extent));
  }
  normalTransform(coordinate, rotation, extent): any {
    /* console.log('what is inside NT ',  coordinate, rotation, getCenter(extent));
    console.log(coordinate); */
    return this.rotateCoordinate(coordinate, -rotation, getCenter(extent));
  }
  rotateCoordinate(coordinate, angle, anchor): any {
    // console.log('what is inside RC ', coordinate, angle, anchor);
    const coord = rotate(
      [coordinate[0] - anchor[0], coordinate[1] - anchor[1]],
      angle
    );
    return [coord[0] + anchor[0], coord[1] + anchor[1]];
  }
  cropingImageOnMainMap(): any {
    console.log('Here starting the cropping ');
    const arrayData = [];
    this.checkToAllowTransformation();
    console.log('Cropping Tool data', this.croppingData, this.isCropingDoneOnMainMap, this.affinTransParams);
    if (this.croppingData !== undefined && /* !this.isCropingDoneOnMainMap && */ this.isGeorefDoneWithTwoPoints) {
      const pointsData =  this.croppingData['co-ordinates'];
      const transformation = new AffineTransformation();
      transformation.matrix = this.affinTransParams.matrix;
      transformation.a_ = this.affinTransParams.rotation;
      transformation.sc_ = this.affinTransParams.scaling;
      transformation.tr_ = this.affinTransParams.transformation;
      transformation.hasControlPoints = true;
      pointsData[0].forEach(points => {
        const returnPoints = transformation.transform([points[0], points[1]]);
        const generatedPoints = transform([returnPoints[0], returnPoints[1]], 'EPSG:3857', 'EPSG:4326');
        arrayData.push([generatedPoints[0], generatedPoints[1]]);
      });
      /* const aa = [];
      aa.push(arrayData[2]);
      aa.push(arrayData[1]);
      aa.push(arrayData[0]);
      aa.push(arrayData[4]);
      aa.push(arrayData[2]);
 */
      const polygonFeature = new Feature(
        new Polygon([arrayData])/* .transform('EPSG:4326', 'EPSG:3857') */);
      const style = new Style({
          fill: new Fill({
            color: 'black'
          })
      });
      const source = new VectorSource({
        style
      });
      source.addFeature(polygonFeature);
      const layer = new VectorLayer({
        source,
      });
      layer.set('name', 'polygonLayer');
      // this.basemapService.getCurrentBasemap().addLayer(layer);
      this.basemapService.getCurrentBasemap().getLayers().forEach(currentLayer => {
        console.log('inside loop ', `GeoRef_${this.layerLocaInst.name}`, currentLayer.values_.name, arrayData);
        if (`GeoRef_${this.layerLocaInst.name}` === currentLayer.values_.name) {
          const imageLayerSource = currentLayer.getSource();
          currentLayer.setSource(imageLayerSource);
          source.on('addfeature', () => {
            currentLayer.setExtent(source.getExtent());
          });
          currentLayer.on('postrender', (e) => {
            const vectorContext = getVectorContext(e);
            e.context.globalCompositeOperation = 'destination-in';
            source.forEachFeature((feature) => {
              vectorContext.drawFeature(feature, style);
            });
            e.context.globalCompositeOperation = 'source-over';
          });
        }
      });
      this.isCropingDoneOnMainMap = true;
      this.layerLocaInst.metadata.imageMask = arrayData;
    }

  }
}

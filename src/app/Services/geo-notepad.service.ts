import { ElementRef, Injectable, Renderer2, RendererFactory2, ViewChild } from '@angular/core';
import { BasemapService } from '../basemap/basemap.service';
import { AuthObservableService } from './authObservableService';
import { unByKey } from 'ol/Observable.js';
import { Observable, Subject, throwError } from 'rxjs';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlOverlay from 'ol/Overlay';

import 'ol/ol.css';
import View from 'ol/View';
import {Draw, Modify, Snap} from 'ol/interaction';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, RegularShape, Stroke, Icon, Style} from 'ol/style';

import GeoJSON from 'ol/format/GeoJSON';
import { environment } from 'src/environments/environment';
import { HttpClientService } from './http-client.service';
import { catchError, map } from 'rxjs/operators';
import { CommonService } from './common.service';
import { GeoPopupComponent } from '../geopopup/geopopup.component';
import { getTopRight, getTopLeft, getBottomRight, getBottomLeft } from 'ol/extent';
import { platformModifierKeyOnly, shiftKeyOnly } from 'ol/events/condition';

export enum ShapesForPoints{
  CIRCLE = 'circle',
  CUSTOM_IMAGE = 'custom_image',
  SQUARE = 'square'
}
@Injectable(
  // {
  //   providedIn: 'root'
  // }
)
export class GeoNotePadService {
  private basemap: OlMap;
  private toolOptions;
  private toolRef: any;
  //   private instance:any;
  private locationClickIcon: string;
  private listener: any;
  private dblClickListenerForAnnotation: any;
  private singleClickListenerForAnnotation: any;

  markerLayer: OlOverlay;
  markerZoom: OlView;

  private renderer: Renderer2;

  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  draw: any;
  snap: any;
  modify: any;

  serverUrl = environment.serverUrl;
  serverUrl2 = environment.serverUrlV2;

  shapeDrawType = {
    LINE_STRING: 'LineString',
    POLYGON: 'Polygon',
    POINT: 'Point'
  };
  shapesForPoints = ShapesForPoints;
  private overlay: any;
  pointerMoveListenerForAnnotation: any;
  annotationOverlayId = 'annotateSaveOption';

  constructor(private basemapService: BasemapService, private observe: AuthObservableService,
              private commonService: CommonService,
              private renderer2: RendererFactory2, private http: HttpClientService) {
    this.renderer = this.renderer2.createRenderer(null, null);
    this.basemap = this.basemapService.getCurrentBasemap();
    // this.instance= new PositionTool(basemap);
    this.locationClickIcon = 'url(/assets/tool-icons/map-icons/PTB2.svg) 25 45, auto';
    this.markerLayer = new OlOverlay({});
    this.markerZoom = new OlView({ projection: this.basemapService.getBaseMapProjection() });

    // Check this https://openlayers.org/en/latest/examples/snap.html
    // to draw lines

    /* this.basemap.on('pointermove', (evt) => {
      const feat = this.basemap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // you can add a condition on layer to restrict the listener
        if (this.commonService.isValid(layer.values_.geopadCustomData)){
          return {feature, layer, pixel: evt};
        }
      });
      if (feat) {
        const pixel = this.basemap.getEventPixel(evt.originalEvent);
        const hit = this.basemap.hasFeatureAtPixel(pixel);
        this.basemap.getViewport().style.cursor = hit ? 'pointer' : '';
      }
    });

    this.listener = this.basemap.on('singleclick', (evt) => {
      const feat = this.basemap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // you can add a condition on layer to restrict the listener
        if (this.commonService.isValid(layer.values_.geopadCustomData)){
          console.log(feature, layer);
          return {feature, layer, pixel: evt};
        }
      });
      console.log(feat);
      if (feat) {
        const data = feat.layer.values_.geopadCustomData;
        console.log('CONTEXT INFO...');
        console.log(data);
        const dataToSend = {
          name: data.site.locationName,
          desc: data.site.description,
          location: data.site.latitudeLongitude,
          projectName: data.project.name,
          placeName: data.place.name,
          topicName: data.topic.name
        };
        console.log('Data to send: ', dataToSend);
        console.log(`*************`);
        // this.showSiteInfo(feat.pixel, dataToSend);
        window.alert(JSON.stringify(dataToSend));
        // here you can add you code to display the coordinates or whatever you want to do
      }
    }); */
  }
  // @ViewChild(GeoPopupComponent) popupComponent: GeoPopupComponent;

  // showSiteInfo(evt, data): void{
  //   console.log('IN showsiteinfo');
  //   console.log(this.popupComponent);
  //   const popupComp = this.popupComponent;
  //   this.overlay = popupComp.getGeoPopup();
  //   popupComp.setContent('geopad-site-info', data);
  //   this.overlay.setPosition(evt.coordinate);
  //   this.basemap.addOverlay(this.overlay);
  //   this.basemap.getOverlays().forEach((overLay, index) => {
  //     console.log(overLay);
  //     if ((this.basemap.getOverlays().getLength() - 1) === index) {
  //       console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1));
  //       if (parseInt(overLay.rendered.top_, 10) < 227) {
  //         overLay.element.style.zIndex = '1';
  //         overLay.element.style.transform = 'rotate(180deg)';
  //         overLay.element.firstChild.firstChild.style.transform = 'rotate(180deg)';
  //       } else {
  //         overLay.element.style.zIndex = '1';
  //         overLay.element.style.transform = 'rotate(0deg)';
  //         overLay.element.firstChild.firstChild.style.transform = 'rotate(0deg)';
  //       }
  //       overLay.element.style.transform = overLay.rendered.transform_;
  //       /* console.log('View ', overLay, overLay.element.firstChild, overLay.getMap(),
  //         overLay.getPositioning(), overLay.getOptions().element.clientHeight, window.screen.height); */
  //     }
  //   });
  // }
  // setIconToSelectLocationInMap(positionMarkObserver: Subject<any>) {
  //   //   console.log('IN  setIconToSelectLocationInMap');
  //   //   console.log(this);
  //   this.unSetIconToSelectLocationInMap();
  //   this.toolRef = null;
  //   this.basemapService.setMouseIcon(this.locationClickIcon);
  //   this.listener = this.basemap.on('singleclick', (evt) => {
  //     console.log(evt);
  //     // const coord = [evt.coordinate[1], evt.coordinate[0]];
  //     const coord = [evt.coordinate[1].toFixed(4), evt.coordinate[0].toFixed(4)];
  //     positionMarkObserver.next({ 'co-ordinates': coord, event: evt });
  //     this.addMarker(coord[0], coord[1], '', false);
  //     setTimeout(() => {
  //       this.unSetIconToSelectLocationInMap(false);
  //     }, 500);
  //   });
  // }



  // unSetIconToSelectLocationInMap(closeMarker = true) {
  //   // console.log('called deactivateTool', this.toolRef);
  //   this.basemapService.setMouseIcon('auto');
  //   unByKey(this.listener);
  //   console.log(this);
  //   this.listener = null;
  //   if (this.basemap === undefined) {
  //     this.basemap = this.basemapService.getCurrentBasemap();
  //   }
  //   this.basemap.removeEventListener('singleclick');
  //   if (closeMarker) {
  //     this.closeMarker('');
  //   }

  // }

  // NEW
  // addMarker(latitude, longitude, idTime, setCenter = true) {
  //   const id = 'notepad_loc_marker'; // +idTime;
  //   let element;
  //   // let marker:OlOverlay;
  //   if (!document.getElementById(id)) {
  //     element = this.renderer.createElement('div');
  //     this.renderer.setProperty(element, 'id', id);
  //     this.renderer.setStyle(element, 'margin-left', '-25px');
  //     this.renderer.setStyle(element, 'margin-top', '-38px');
  //     this.renderer.setStyle(element, 'position', 'relative');
  //     const imgElement = this.renderer.createElement('img');
  //     this.renderer.setProperty(imgElement, 'src',
  //       'https://cdn.mapmarker.io/api/v1/fa/stack?size=50&color=DC4C3F&icon=fa-microchip&hoffset=1');

  //     const iconElement = this.renderer.createElement('i');
  //     this.renderer.addClass(iconElement, 'material-icons');
  //     this.renderer.appendChild(iconElement, this.renderer.createText('cancel'));
  //     this.renderer.setStyle(iconElement, 'cursor', 'pointer');
  //     this.renderer.setStyle(iconElement, 'position', 'absolute');
  //     this.renderer.setStyle(iconElement, 'top', '0');
  //     this.renderer.setStyle(iconElement, 'right', '0');
  //     this.renderer.setStyle(iconElement, 'font-size', '18px');
  //     this.renderer.listen(iconElement, 'click', (event) => {
  //       document.getElementById(id).remove();
  //       this.markerLayer.setPosition(undefined);
  //       this.basemap.removeOverlay(this.markerLayer);
  //     });

  //     this.renderer.appendChild(element, imgElement);
  //     this.renderer.appendChild(element, iconElement);

  //   } else {
  //     element = document.getElementById(id);
  //   }

  //   this.markerLayer.setPosition([longitude, latitude]);
  //   this.markerLayer.setElement(element);

  //   if (setCenter) {
  //     // this.markerZoom.setCenter([longitude, latitude]);
  //     this.markerZoom.setCenter([Number(longitude), Number(latitude)]);
  //     this.markerZoom.setZoom(this.basemap.getView().getZoom());
  //     this.basemap.setView(this.markerZoom);
  //   }

  //   this.basemap.addOverlay(this.markerLayer);

  // }

  /**
   * Locate a single point on map
   */
  getLayerStyle(shapeInfo: any, siteParams = null): Style{
    let imageStyle = null;
    console.log(shapeInfo);
    console.log(siteParams);
    if (!this.commonService.isValid(siteParams)){
        if (shapeInfo.shape === this.shapesForPoints.CIRCLE) {
          imageStyle = new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: shapeInfo.color
            })
          });
        } else if (shapeInfo.shape === this.shapesForPoints.CUSTOM_IMAGE) {
          imageStyle = new Icon({
            crossOrigin: 'anonymous',
            // For Internet Explorer 11
            // imgSize: [26, 26],
            // size: [26, 26],
            src: shapeInfo.url,
          });
        } else if (shapeInfo.shape === this.shapesForPoints.SQUARE) {
          imageStyle = new RegularShape({
            fill: new Fill({color: shapeInfo.color}),
            stroke: new Stroke({color: shapeInfo.color, width: 2}),
            points: 4,
            radius: 7,
            angle: Math.PI / 4,
          });
        }
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.4)' // 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new Stroke({
            color: '#e91e63', // '#ffcc33',
            width: 2
          }),
          image: imageStyle
        });
    } else {
      let imageStyle1 = null;
      // let url = 'assets/svgs/site_marker_red_basemap_30px.svg';
      // let url = 'assets/svgs/address-marker_30px.svg';
      let url = 'assets/svgs/point-marker.svg';
      let strokeColor = '#e91e63';
      let strokeWidth = 2;
      let fillColor = 'rgba(255, 255, 255, 0.4)';
      const siteIconObj = siteParams.icon;
      let lineDash = null;
      let symbolSize = '4';
      if (siteParams.siteType === this.shapeDrawType.POINT){
        if (this.commonService.isValid(siteParams.symbolSize)) {
          symbolSize = siteParams.symbolSize;
        }
        if (this.commonService.isValid(siteIconObj)){
          if (this.commonService.isValid(siteIconObj.imgUrl)){
            url = siteIconObj.imgUrl;
          }
        }
        imageStyle1 = new Icon({
          // anchor: [0.5, 46],
          // anchorXUnits: 'fraction',
          // anchorYUnits: 'pixels',
          color: siteParams.color || '#BADA55', // '#BADA55',
          crossOrigin: 'anonymous',
          // For Internet Explorer 11
          // imgSize: [26, 26],
          // size: [26, 26],
          src: url,
        });
        if (this.commonService.isValid(siteIconObj)){
          if (this.commonService.isValid(siteIconObj.imgUrl)){
            imageStyle1.setScale(parseInt(symbolSize, 10) / 100);
          }
        }

        const angleInRadians = Number(siteParams.rotationAngle) * (Math.PI / 180);
        imageStyle1.setRotation(angleInRadians);
        console.log(imageStyle1);
      } else {
        if (this.commonService.isValid(siteParams.symbolSize)) {
          strokeWidth = siteParams.symbolSize;
        }

        if (siteIconObj.value === 'DottedLine'){
          lineDash = [strokeWidth / 2, strokeWidth * 3];
        } else if (siteIconObj.value === 'line'){
          lineDash = null;
        } else if (siteIconObj.value === 'DashLine'){
          lineDash = [strokeWidth * 2, strokeWidth * 3];
        } else if (siteIconObj.value === 'Dash/DottedLine'){
          lineDash = [strokeWidth / 2, strokeWidth * 3, strokeWidth * 2, strokeWidth * 3];
        }

        if (this.commonService.isValid(siteParams.color)){
          strokeColor = siteParams.color;
        }
        if (this.commonService.isValid(siteParams.fillColor)){
          fillColor = siteParams.fillColor + '66';
        }
      }

      const strokeObj: Stroke = new Stroke({
        width: strokeWidth
      });
      if (siteParams.siteType !== this.shapeDrawType.POINT){
        strokeObj.setLineDash(lineDash);
        strokeObj.setColor(strokeColor);
      }
      const style: Style = new Style({
        fill: new Fill({
          color: fillColor
        }),
        stroke: strokeObj
      });
      if (siteParams.siteType === this.shapeDrawType.POINT){
        style.setImage(imageStyle1);
      }
      console.log('STYLE');
      console.log(style);
      return style;
    }
  }
  setupMapToDrawSketch(shape): void{
    // this.raster = new TileLayer({
    //   source: new OSM()
    // });
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: this.getLayerStyle(shape)
    });
    // this.basemap.addLayer(this.raster);
    if (!this.commonService.isValid(this.basemap)){
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    console.log('here getting the error ', this.basemap);
    if (this.basemap !== undefined) {
      this.basemap.addLayer(this.vector);
    } else {
      this.basemap = this.basemapService.getCurrentBasemap();
    }
  }
  locatePointOrPolygonOnMap(drawType, positionMarkObserver: Subject<any>, context): void{
    if (!this.commonService.isValid(this.basemap)){
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    const shape = this.getShapeOfaContext(context);
    this.setupMapToDrawSketch(shape);
    this.basemap.removeInteraction(this.draw);
    this.basemap.removeInteraction(this.snap);

    this.draw = new Draw({
      source: this.source,
      type: drawType // 'Point'
    });
    this.basemap.addInteraction(this.draw);
    this.snap = new Snap({source: this.source});
    this.basemap.addInteraction(this.snap);

    // if (drawType === this.shapeDrawType.POINT) {
    //   this.listener = this.basemap.on('singleclick', (evt) => {
    //       console.log(evt);
    //       this.getFeaturesOfPointOrPolygonOnMap(drawType, positionMarkObserver);
    //   });
    // } else {
    this.vector.getSource().on('addfeature', (event) => {
      console.log('feature added');
      // this.getFeaturesOfPolygon(polygonDrawType, positionMarkObserver);
      this.getFeaturesOfPointOrPolygonOnMap(drawType, positionMarkObserver);
    });
    // }
  }
  getFeaturesOfPointOrPolygonOnMap(drawType, positionMarkObserver: Subject<any>): void{
    try {
      if (!this.commonService.isValid(this.basemap)){
        this.basemap = this.basemapService.getCurrentBasemap();
      }
      console.log(this.snap);
      console.log(this.snap.getFeatures_());
      const features = this.snap.getFeatures_();
      console.log(features);
      const newForm = new GeoJSON();
      const featColl = newForm.writeFeaturesObject(features);
      console.log(featColl);
      const data = {
        features: featColl,
        'co-ordinates': featColl.features[0].geometry.coordinates,
        name: `temp_${drawType}_${new Date().getTime()}`,
        from: drawType // 'position'
      };
      positionMarkObserver.next(data);
      // this.reDrawPointOrPolygonOnMap(drawType, data);
      setTimeout(() => {
        // this.basemap.removeInteraction(this.draw);
        // this.basemap.removeInteraction(this.snap);
        // this.basemap.removeLayer(this.raster);
        // this.basemap.removeLayer(this.vector);
        this.removePolygonMarkTools();
      }, 1000);
    } catch (e) { console.log(e); }
  }
  removePolygonMarkTools(): void{
    this.basemap.removeInteraction(this.draw);
    this.basemap.removeInteraction(this.snap);
    this.basemap.removeLayer(this.raster);
    this.basemap.removeLayer(this.vector);
    // this.unListenOnAnnotateToolClicks();
  }
  

  reDrawPointOrPolygonOnMap(drawType, geoJson, zoomToLayer, watchOnPolygonChanges: Subject<any> = null,
                            context, siteParams = null): void{
    console.log(geoJson, drawType);
    const shape = this.getShapeOfaContext(context);
    console.log(shape);
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson.features, {
        featureProjection: this.basemapService.getBaseMapProjection()
      })
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.getLayerStyle(shape, siteParams)
    });
    vectorLayer.set('name', geoJson.name);
    vectorLayer.set('geopadCustomData', context);
    if (!this.commonService.isValid(this.basemap)){
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    this.basemap.addLayer(vectorLayer);
    if (this.commonService.isValid(watchOnPolygonChanges)) {
      console.log('SUBSCRIBED FOR POLYGON CHANGES');
      this.modify = new Modify({source: vectorSource});
      this.basemap.addInteraction(this.modify);
      try{
        console.log(this.modify);
        this.listener = this.modify.on('modifyend', (event) => {
          const features = event.features.getArray();
          const newForm = new GeoJSON();
          const featColl = newForm.writeFeaturesObject(features);
          const data = {
            features: featColl,
            'co-ordinates': featColl.features[0].geometry.coordinates,
            name: geoJson.name,
            from: drawType
          };
          watchOnPolygonChanges.next(data);
          
        });
        
      }catch (e){
        console.log(e);
      }
      
    }
    if (zoomToLayer) {
      console.log(vectorLayer);
      console.log(vectorLayer.values_);
      console.log(vectorLayer.values_.source);
      console.log(vectorLayer.values_.source.getExtent());
      const extents = vectorLayer.values_.source.getExtent();
      const extent = [];
      extents.forEach(element => {
        extent.push(Number(element));
      });
      // extent.push(Number(extents[0]));
      // extent.push(Number(extents[1]));
      if (drawType === this.shapeDrawType.POINT) {
        this.basemap.values_.view.setCenter(extent);
        this.basemap.getView().setZoom(17);
      } else {
        this.basemap.getView().fit(extents);
        this.basemap.getView().setZoom(this.basemap.getView().getZoom() - 1);
      }
    }
  }

  updateSiteStyle(layerObj: any, siteParams: any): void{
    const style = this.getLayerStyle({}, siteParams);
    layerObj.setStyle(style);
  }

  clearPolygonDrawingTools(): void{
    console.log('IN clearPolygonDrawingTools');
    if (this.commonService.isValid(this.modify)) {
      unByKey(this.listener);
      this.basemap.removeInteraction(this.modify);
      this.modify = null;
      this.listener = null;
    }
  }


  removeFeatureOnMap(currentFeature): void{
    try{
      if (!this.commonService.isValid(this.basemap)){
        this.basemap = this.basemapService.getCurrentBasemap();
      }
      const layerObj: VectorLayer = this.commonService.getLayerOfMap(this.basemap, currentFeature.name);
      if (this.commonService.isValid(layerObj)){
        this.basemap.removeLayer(layerObj);
      }
    } catch (e) { console.log(e); }
  }

  removeLayerFromMap(mapObj: OlMap, layerName: string): void{

    const addedLayerObj: VectorLayer = this.commonService.getLayerOfMap(mapObj, layerName);
    if (this.commonService.isValid(addedLayerObj)){
      mapObj.removeLayer(addedLayerObj);
    }

    
  }


  getShapeOfaContext(contextInfo): any{
    // console.log('IN getShapeOfContext');
    // console.log(contextInfo);
    try{
      let projectName = '';
      let topicName = '';
      if (this.commonService.isValid(contextInfo.site) && this.commonService.isValid(contextInfo.site.project)) {
        projectName = contextInfo.site.project.name;
      } else if (this.commonService.isValid(contextInfo.project) && contextInfo.project.topicId !== 'ALL') {
        projectName = contextInfo.project.name;
      } else {
        throw new Error('');
      }

      if (this.commonService.isValid(contextInfo.site) && this.commonService.isValid(contextInfo.site.topic)) {
        topicName = contextInfo.site.topic.name;
      } else if (this.commonService.isValid(contextInfo.topic) && contextInfo.topic.topicId !== 'ALL') {
        topicName = contextInfo.topic.name;
      } else {
        throw new Error('');
      }

      let locShape = this.shapesForPoints.CIRCLE;
      if (projectName === 'Need') {
        locShape = this.shapesForPoints.CIRCLE;
      } else {
        locShape = this.shapesForPoints.SQUARE;
      }
      // Violet–Indigo–Blue–Green–Yellow–Orange–Red
      if (topicName === 'Oxygen'){
        // return { shape: this.shapesForPoints.CUSTOM_IMAGE, color: '#e91e63',
        //         // url: 'assets/images/markers-icon-new.png'};
        //         url: 'assets/svgs/site_marker_basemap_30px.svg'};
        return { shape: locShape, color: 'red', url: ''};
      } else if (topicName === 'Blood'){
        return { shape: locShape, color: 'orange', url: ''};
      } else if (topicName === 'Plasma'){
        return { shape: locShape, color: 'yellow', url: ''};
      } else if (topicName === 'Hospital'){
        return { shape: locShape, color: 'green', url: ''};
      } else if (topicName === 'Medicines'){
        return { shape: locShape, color: 'blue', url: ''};
      } else if (topicName === 'Food'){
        return { shape: locShape, color: 'indigo', url: ''};
      } else if (topicName === 'Others'){
        return { shape: locShape, color: 'violet', url: ''};
      } else if (topicName === 'Vaccination'){
        return { shape: locShape, color: '#607d8b', url: ''};
      } else {
        // return { shape: this.shapesForPoints.CIRCLE, color: '#e91e63', url: ''}; // '#e91e63'};
        return { shape: this.shapesForPoints.CUSTOM_IMAGE, color: '#e91e63',
                // url: 'assets/images/markers-icon-new.png'};
                // url: 'assets/svgs/site_marker_red_basemap_30px.svg'};
                url: 'assets/svgs/point-marker.svg'};
      }
    } catch (e) {
      // console.log(e);
      // return { shape: this.shapesForPoints.CIRCLE, color: '#e91e63', url: ''}; // '#e91e63'};
      return { shape: this.shapesForPoints.CUSTOM_IMAGE, color: '#e91e63',
                // url: 'assets/images/markers-icon-new.png'};
                // url: 'assets/svgs/site_marker_red_basemap_30px.svg'};
                // url: 'assets/svgs/address-marker_30px.svg'};
                url: 'assets/svgs/point-marker.svg'};
    }
  }

  // getting list of observations list(sites list)
  getSitesList(geopadId): Observable<any>{
    console.log('API calling getting sites list ', geopadId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites';
    return this.http.get(url);
  }

  // getting list of observations list(sites list)
  getSitesListWithItems(geopadId): Observable<any>{
    console.log('API calling getting sites list with items ', geopadId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items';
    return this.http.get(url);
  }

  // getting single observation(sites)
  getSiteInfo(geopadId, siteId): Observable<any>{
    console.log('API calling getting sites list ', geopadId, siteId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/' + siteId;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // save single site i.e. single observation
  saveSingleSite(siteInfo, geopadId): Observable<any>{
    console.log('API calling getting sites list ', siteInfo, geopadId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites';
    return this.http.post(url, siteInfo);
    //   .pipe(map((response: any) => {
    //       return response;
    //     }), catchError((err: any) => {
    //       console.log(err);
    //       return err;
    //     })
    //   );
  }

  // save multiple sites i.e. multiple observations list
  saveSitesList(siteListInfo, geopadId): Observable<any>{
    console.log('API calling getting sites list ', siteListInfo, geopadId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/multiple';
    return this.http.post(url, siteListInfo)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // update single site i.e. single observation
  updateSingleSite(siteInfo, geopadId, siteId): Observable<any>{
    console.log('API calling getting sites list ', siteInfo, geopadId, siteId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/' + siteId;
    return this.http.put(url, siteInfo);
    //   .pipe(map((response: any) => {
    //       return response;
    //     }), catchError((err: any) => {
    //       console.log(err);
    //       return err;
    //     })
    //   );
  }

  // Delete the site
  deleteSingleSite(siteId): Observable<any>{
    console.log('API calling Delete site ', siteId);
    const url = this.serverUrl + '/api/geopads/' + siteId + '/sites';
    return this.http.delete(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // Delete the relation table of geopad-site
  deleteRelationGeopadSite(geopadId, siteId): Observable<any>{
    console.log('API calling Delete site ', geopadId, siteId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/' + siteId;
    return this.http.delete(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }

  // get site list by filter projectid
  getAllSitesMatchedWithString(sessionID, geopadId, projectId, placeId, topicId, searchStr, searchSiteType,
                               isGuest = false, lastNoOfDays = 0): Observable<any>{
    console.log('API calling getting all sites list', geopadId);
    // const url = `${this.serverUrl}/api/geopads/${geopadId}/sites/items/search/${searchStr}?siteType=${searchSiteType}`;
    // return this.http.get(url);

    // https://qa.fuse.earth:8443/fusedotearth-v2/api/v2/geobases/{sessionID}/geopads/{geopadID}/sites/
    const url = `${this.serverUrl2}/api/v2/geobases/${sessionID}/geopads/${geopadId}/sites/`;
    const bodyData = {
        projectId: projectId === 'ALL' ? 0 : projectId,
        topicId: topicId === 'ALL' ? 0 : topicId,
        placeId: placeId === 'ALL' ? 0 : placeId,
        searchText: searchStr,
        siteType: searchSiteType,
        noOfDays: lastNoOfDays
    };
    if (isGuest){
      // url = this.serverUrl + '/api/guest/geopads/' + geopadId + '/sites/items';
    }
    return this.http.post(url, bodyData);
  }
  getSitesListWithItemsByProjectId(geopadId, projectId): Observable<any>{
    console.log('API calling getting sites list with items filterby projectId', geopadId, projectId);
    const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId;
    return this.http.get(url);
  }
  getSitesListWithItemsFilterByProjectIdPlaceIdAndTopicId(geopadId, projectId, placeId, topicId,
                                                          isGuest = false, lastNoOfDays = 0): Observable<any>{
    let url = '';
    if (projectId !== 'ALL' && placeId !== 'ALL' && topicId !== 'ALL') {
      console.log('GETTING SITES OF SPECIFIC PROJECT, PLACE, TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId + '/' + placeId + '/' + topicId;
      // 000
    }
    else if (projectId !== 'ALL' && placeId !== 'ALL' && topicId === 'ALL') {
      console.log('GETTING SITES OF SPECIFIC PROJECT, PLACE AND ALL TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId + '/' + placeId;
      // 001
    }
    else if (projectId !== 'ALL' && placeId === 'ALL' && topicId !== 'ALL') {
      console.log('GETTING SITES OF SPECIFIC PROJECT, TOPIC AND ALL PLACE...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId + '/' + topicId;
      // 010
    }
    else if (projectId !== 'ALL' && placeId === 'ALL' && topicId === 'ALL') {
      console.log('GETTING SITES OF SPECIFIC PROJECT, AND ALL PLACE AND ALL TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId;
      // 011
    }
    else if (projectId === 'ALL' && placeId !== 'ALL' && topicId !== 'ALL') {
      console.log('GETTING SITES OF ALL PROJECT AND SPECIFIC PLACE, TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + placeId + '/' + topicId;
      // 100
    }
    else if (projectId === 'ALL' && placeId !== 'ALL' && topicId === 'ALL') {
      console.log('GETTING SITES OF SPECIFIC PLACE AND ALL PROJECT, TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + placeId;
      // 101
    }
    else if (projectId === 'ALL' && placeId === 'ALL' && topicId !== 'ALL') {
      console.log('GETTING SITES OF SPECIFIC TOPIC, AND ALL PROJECT, PLACE...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + topicId;
      // 110
    }
    else if (projectId === 'ALL' && placeId === 'ALL' && topicId === 'ALL') {
      console.log('GETTING SITES OF ALL PROJECT, PLACE, TOPIC...');
      url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items';
      // 111
    }

    if (isGuest){
      url = this.serverUrl + '/api/guest/geopads/' + geopadId + '/sites/items';
    }

    if (lastNoOfDays !== 0){
      url = `${url}?noOfDays=${lastNoOfDays}`;
    }
    // const url = this.serverUrl + '/api/geopads/' + geopadId + '/sites/items/' + projectId + '/' + placeId + '/' + topicId;
    return this.http.get(url);
  }

  downloadFile(fileUrl: string, name: string): Observable<any>{
    return this.http.get(fileUrl, {responseType: 'blob'})
            .pipe(map(response => {
                console.log(response);
                return {
                    filename: name,
                    data: response
                };
            }), catchError((err): any => {
                return throwError(err);
         }));
  }

  getSiteIconInfo(iconCategory, iconSubCategory): Observable<any>{
    console.log('API calling For getting sites icons drop downs ', iconCategory, iconSubCategory);
    const url = this.serverUrl2 + '/api/v2/site/icons?iconCategory=' + iconCategory + '&iconSubCategory=' + iconSubCategory;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return err;
      })
      );
  }
  saveCustomSiteIconInfo(customIconInfo): Observable<any> {
    const url = this.serverUrl2 + '/api/v2/site/icons';
    return this.http.post(url, customIconInfo);
  }
}

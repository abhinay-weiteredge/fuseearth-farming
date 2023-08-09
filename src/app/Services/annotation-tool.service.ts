import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BasemapService } from '../basemap/basemap.service';
import { AuthObservableService } from './authObservableService';
import { unByKey } from 'ol/Observable.js';
import { Subject } from 'rxjs';
import OlMap from 'ol/Map';
import OlOverlay from 'ol/Overlay';
import {Draw, Modify, Snap} from 'ol/interaction';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import { Vector as VectorSource} from 'ol/source';
import {Circle as CircleStyle, Fill, RegularShape, Stroke, Icon, Style} from 'ol/style';

import GeoJSON from 'ol/format/GeoJSON';
import { HttpClientService } from './http-client.service';
import { CommonService } from './common.service';
import { getTopRight, getTopLeft, getBottomRight, getBottomLeft } from 'ol/extent';
import { platformModifierKeyOnly, shiftKeyOnly } from 'ol/events/condition';
import { ShapesForPoints } from './geo-notepad.service';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';


export class AnnotationDisplayObj{
  id: string;
  name: string;
  raster: TileLayer;
  vector: VectorLayer;
  source: VectorSource;
  draw: any;
  snap: any;
  modify: any;
  modifyListener: any;
  pointerMoveListenerOnAnnotation: any;
  isActive: boolean;
}

@Injectable(
//   {
//   providedIn: 'root'
// }
)
export class AnnotationToolService {

  private basemap: OlMap;
  private renderer: Renderer2;

  raster: TileLayer;
  vector: VectorLayer;
  // source: VectorSource;
  draw: any;
  snap: any;
  modify: any;

  shapeDrawType = {
    LINE_STRING: 'LineString',
    POLYGON: 'Polygon',
    POINT: 'Point'
  };

  private dblClickListenerForAnnotation: any;
  private singleClickListenerForAnnotation: any;
  shapesForPoints = ShapesForPoints;

  annotations: Array<AnnotationDisplayObj> = [];

  public onPolygonChanges: Subject<any> = new Subject<any>();
  public onPositionMark: Subject<any> = new Subject<any>();
  public onCancelAnnotation: Subject<any> = new Subject<any>();
  public onSaveAnnotation: Subject<any> = new Subject<any>();
  annotationCursorIcon = 'url(/assets/tool-icons/map-icons/RTB.svg) 25 45, auto';
  constructor(private basemapService: BasemapService, private observe: AuthObservableService,
              private commonService: CommonService,
              private renderer2: RendererFactory2, private http: HttpClientService) {
    this.renderer = this.renderer2.createRenderer(null, null);
    this.basemap = this.basemapService.getCurrentBasemap();
  }

  /**
   * Locate a single point on map
   */
  getLayerStyle(shapeInfo: any, siteParams = null): Style{
    let imageStyle = null;
    console.log(shapeInfo);
    console.log(siteParams);
    // if (!this.commonService.isValid(siteParams)){
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
  }

  getCurrAnnotateObj(id): AnnotationDisplayObj{
    const index = this.annotations.findIndex(obj => String(obj.id) === String(id));
    if (index !== -1){
      return this.annotations[index];
    } else {
      return null;
    }
  }
  reDrawPointOrPolygonOnMap(drawType, geoJson): void{
    console.log(geoJson, drawType);
    console.log('IN reDrawPointOrPolygonOnMap');
    const shape = this.getShapeOfaContext();
    console.log(shape);
    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(geoJson.features, {
        featureProjection: this.basemapService.getBaseMapProjection()
      })
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.getLayerStyle(shape)
    });
    vectorLayer.set('name', geoJson.name);
    vectorLayer.set('fe_id', geoJson.id);
    if (!this.commonService.isValid(this.basemap)){
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    this.basemap.addLayer(vectorLayer);

    // TO STORE ANNOTATION LISTENERS
    const annotationDisplayObjRef: AnnotationDisplayObj = new AnnotationDisplayObj();
    annotationDisplayObjRef.id = geoJson.id;
    annotationDisplayObjRef.name = geoJson.name;
    annotationDisplayObjRef.vector = vectorLayer;
    this.annotations.push(annotationDisplayObjRef);




    // TO MONITOR CHANGES
    console.log('SUBSCRIBED FOR POLYGON CHANGES');
    const modify = new Modify({source: vectorSource});
    this.getCurrAnnotateObj(geoJson.id).modify = modify;
    this.basemap.addInteraction(this.getCurrAnnotateObj(geoJson.id).modify);
    try{
      console.log(this.getCurrAnnotateObj(geoJson.id).modify);
      const listener = this.getCurrAnnotateObj(geoJson.id).modify.on('modifyend', (event) => {
        const features = event.features.getArray();
        const newForm = new GeoJSON();
        const featColl = newForm.writeFeaturesObject(features);
        const data = {
          features: featColl,
          'co-ordinates': featColl.features[0].geometry.coordinates,
          name: geoJson.name,
          from: drawType,
          id: geoJson.id
        };
        console.log(data);
        console.log(data['co-ordinates']);
        this.onPolygonChanges.next(data);


        const extentsToUpdateBondaries = vectorLayer.values_.source.getExtent();
        const updatedBoundaryExtentArr = [];
        extentsToUpdateBondaries.forEach(element => {
          updatedBoundaryExtentArr.push(Number(element));
        });

        if (drawType !== this.shapeDrawType.POINT){
        // UPDATING ANNOTATION BOOUNDARY
        const extentCoordsOnModify = this.getExtentBoundaryCoords(updatedBoundaryExtentArr);
        this.drawAnnotationBoundary(extentCoordsOnModify, `${geoJson.name}_boundary`, 'update');
        }
        // UPDATING ANNOTATION SAVE OPTION POSITION
        const topRightToUpdateSaveOption = getTopRight(updatedBoundaryExtentArr);
        const annotateCloseOptionOverlay = this.basemap.getOverlayById(`${geoJson.name}_save`);
        if (this.commonService.isValid(annotateCloseOptionOverlay)){
          annotateCloseOptionOverlay.setPosition(topRightToUpdateSaveOption);
        }
      });
      this.getCurrAnnotateObj(geoJson.id).modifyListener = listener;


      const extentsToAddBoundary = vectorLayer.values_.source.getExtent();
      const boundaryExtentArrToAdd = [];
      extentsToAddBoundary.forEach(element => {
        boundaryExtentArrToAdd.push(Number(element));
      });
      if (drawType !== this.shapeDrawType.POINT){
      // ADDING ANNOTATION BOUNDARY
      const extentCoords = this.getExtentBoundaryCoords(boundaryExtentArrToAdd);
      this.drawAnnotationBoundary(extentCoords, `${geoJson.name}_boundary`, 'add');
      }
      // ADDING ANNOTATION SAVE OPTIONS
      const topRightToAddSaveOption = getTopRight(boundaryExtentArrToAdd);
      const annotationCloseOptionOverlay: OlOverlay = new OlOverlay({id: `${geoJson.name}_save` /*this.annotationOverlayId*/ });
      annotationCloseOptionOverlay.setPosition(topRightToAddSaveOption);
      const saveOptionEle = this.createAnnotationSaveOption(geoJson.id);
      console.log(saveOptionEle);
      annotationCloseOptionOverlay.setElement(saveOptionEle);
      this.basemap.addOverlay(annotationCloseOptionOverlay);


      // if (drawType !== this.shapeDrawType.POINT){
      // MONITORING POINTER MOVE ON MAP TO HIGH LIGHT BOUNDAARY
      let selected = null;
      const pointerMoveListenerForAnnotation = this.basemap.on('pointermove', (evt) => {
        // console.log(evt);
        // console.log('POINTER MOVE');
        if (this.commonService.isValid(selected)) {
          selected.setStyle(this.getAnnotationBoundaryStyle('default'));
          selected = null;
        }
        const feat = this.basemap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          // console.log(feature);
          // console.log(layer);
          if (this.commonService.isValid(layer)){
            if (layer.values_.name === /*`${geoJson.name}_boundary`*/ geoJson.name){
              // console.log(feature, layer);
              return layer;
            }
          }
        });
        if (this.commonService.isValid(feat)){
          // console.log('LAYER FOUND');
          // console.log(feat);
          const layerObj: VectorLayer = this.commonService.getLayerOfMap(this.basemap, `${geoJson.name}_boundary`);
          if (this.commonService.isValid(layerObj)){
            // console.log(layerObj);
            selected = layerObj;
            layerObj.setStyle(this.getAnnotationBoundaryStyle('selected'));
            this.showOptionsForLayer(geoJson.id);
          }

          // BOUNDARY NOT ADDED FOR POINTS. SO, SHOWING OPTIONS SEPARATELY
          if (drawType === this.shapeDrawType.POINT){
            const pointLayerObj: VectorLayer = this.commonService.getLayerOfMap(this.basemap, `${geoJson.name}`);
            if (this.commonService.isValid(pointLayerObj)){
              this.showOptionsForLayer(geoJson.id);
            }
          }
        }
      });
      this.getCurrAnnotateObj(geoJson.id).pointerMoveListenerOnAnnotation = pointerMoveListenerForAnnotation;
      // }


    }catch (e){
      console.log(e);
    }


  }

  showOptionsForLayer(optionId): void{
    // console.log('In showOptionsForLayer');
    // console.log(this.annotations);
    // console.log(optionId);

    this.annotations.forEach(element => {
      if (String(element.id) === String(optionId)){
        document.getElementById(element.id).style.display = 'block';
      } else {
        document.getElementById(element.id).style.display = 'none';
      }
    });
  }


  getShapeOfaContext(): any{
    // console.log('IN getShapeOfContext');
    // console.log(contextInfo);
    return { shape: this.shapesForPoints.CIRCLE, color: '#e91e63', url: ''}; // '#e91e63'};
    // return { shape: this.shapesForPoints.CUSTOM_IMAGE, color: '#e91e63',
    //         // url: 'assets/images/markers-icon-new.png'};
    //         // url: 'assets/svgs/site_marker_red_basemap_30px.svg'};
    //         url: 'assets/svgs/point-marker.svg'};
  }

  /**
   * ANNOTATION RELATED CODE START
   */
  drawShapesWithAnnotateTool(): void{
    if (!this.commonService.isValid(this.basemap)){
      this.basemap = this.basemapService.getCurrentBasemap();
    }
    this.basemapService.setMouseIcon(this.annotationCursorIcon);
    this.listenOnAnnotateToolClicks();
    const shape = this.getShapeOfaContext();
    // this.setupMapToDrawSketch(shape);

    const source = new VectorSource();
    this.vector = new VectorLayer({
      source,
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


    this.basemap.removeInteraction(this.draw);
    this.basemap.removeInteraction(this.snap);

    this.draw = new Draw({
      source,
      type: this.shapeDrawType.LINE_STRING
    });
    console.log(this.draw);
    this.basemap.addInteraction(this.draw);
    this.snap = new Snap({source});
    this.basemap.addInteraction(this.snap);
  }

  listenOnAnnotateToolClicks(): void{
    console.log('IN listenOnAnnotateToolClicks');

    this.singleClickListenerForAnnotation = this.basemap.on('singleclick', (evt) => {
      console.log(evt);
      const isCtrl = platformModifierKeyOnly(evt);
      const isShift = shiftKeyOnly(evt);
      console.log(`IS CTRL: ${isCtrl}`);
      console.log(`IS Shift: ${isShift}`);
      setTimeout(() => {
        if (isCtrl){
          console.log('PREPARINIG TO REDRAW POINT');
          const feat = this.basemap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            // you can add a condition on layer to restrict the listener
            console.log(feature);
            console.log(layer);
            // if (feature.values_.geometry.constructor.name === this.shapeDrawType.POINT){
            if (feature.values_.geometry instanceof Point){
              console.log('ITS A POINT');
              const coords = feature.values_.geometry.flatCoordinates;
              console.log(coords);
              const coordinates = [];
              coordinates.push(coords[coords.length - 2]);
              coordinates.push(coords[coords.length - 1]);

              console.log(coordinates);
              console.log(layer);
              this.getShapeFeaturesFromAnnotationTool(this.shapeDrawType.POINT, coordinates);
            } else {
              console.log('NOT A POINT');
            }
          });
          console.log(feat);
        }
        // if (isShift){
        //   this.draw.setProperties({freehand: true});
        //   console.log(this.draw);
        // }
      });
    });
    this.dblClickListenerForAnnotation = this.basemap.on('dblclick', (evt) => {
      console.log(evt);
      const isCtrl1 = platformModifierKeyOnly(evt);
      console.log(`IS CTRL: ${isCtrl1}`);
      setTimeout(() => {
        console.log(evt);
        const isCtrl = platformModifierKeyOnly(evt);
        console.log(`IS CTRL: ${isCtrl}`);
        let type = this.shapeDrawType.LINE_STRING;
        if (isCtrl){
          console.log('PREPARINIG TO REDRAW POLYGON');
          type = this.shapeDrawType.POLYGON;
        } else{
          console.log('PREPARINIG TO REDRAW LINE');
          type = this.shapeDrawType.LINE_STRING;
        }
        const feat = this.basemap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          // you can add a condition on layer to restrict the listener
          console.log(feature);
          console.log(layer);
          // if (feature.values_.geometry.constructor.name === this.shapeDrawType.LINE_STRING){
          if (feature.values_.geometry instanceof LineString){
            console.log('ITS A LINE STRING');
            const coords = feature.values_.geometry.flatCoordinates;
            console.log(coords);

            let coordinates = [];
            for (let index = 0; index < coords.length; index = index + 2){
              coordinates.push([coords[index], coords[index + 1]]);
            }
            if (type === this.shapeDrawType.POLYGON){
              coordinates.push(coordinates[0]);
              coordinates = [coordinates];
            }
            console.log('CO-ORDS');
            console.log(coordinates);
            this.getShapeFeaturesFromAnnotationTool(type, coordinates);
          } else {
            console.log('NOT A LINE STRING');
          }
        });
      }, 100);
    });
  }

  getShapeFeaturesFromAnnotationTool(drawType, coordinates): void{
    try {
      console.log('getShapeFeaturesFromAnnotationTool');
      if (!this.commonService.isValid(this.basemap)){
        this.basemap = this.basemapService.getCurrentBasemap();
      }
      const data = {
        features: null,
        'co-ordinates': coordinates,
        name: `temp_${drawType}_${new Date().getTime()}`,
        from: drawType // 'position'
      };
      this.onPositionMark.next(data);
      setTimeout(() => {
        this.removePolygonMarkTools();
        setTimeout(() => {
          this.drawShapesWithAnnotateTool();
        });
      });
    } catch (e) { console.log(e); }
  }

  getAnnotationBoundaryStyle(type = 'default'): Style{
    const strokeColor = type === 'default' ? '#d0d0d0' : // '#9e9e9e' :
                      type === 'selected' ? 'yellow' : '#d0d0d0'; // '#9e9e9e';
    const strokeWidth = type === 'default' ? 1 :
                      type === 'selected' ? 2 : 1;
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0)'
      }),
      stroke: new Stroke({
        width: strokeWidth, // 2,
        color: strokeColor // '#9e9e9e'
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          width: strokeWidth, // 2,
          color: strokeColor // '#9e9e9e'
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)'
        })
      })
    });
  }

  getExtentBoundaryCoords(extent): any{
    const topLeft = getTopLeft(extent);
    const topRight = getTopRight(extent);
    const bottomRight = getBottomRight(extent);
    const bottomLeft = getBottomLeft(extent);

    const extentCoords = [topLeft, topRight, bottomRight, bottomLeft, topLeft];
    return extentCoords;
  }
  drawAnnotationBoundary(extentCoords, boundaryLayerName, op): void{
    // console.log('IN drawAnnotationBoundary');
    // console.log(extentCoords);
    const data = {
      features: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: this.shapeDrawType.POLYGON, coordinates: [extentCoords] },
          properties: null
        }]
      },
      name: boundaryLayerName
    };

    // ADDING 4 CORNER POINT FEATURE DATA
    for (let index = 0; index < 4; index ++){
      data.features.features.push({
          type: 'Feature',
          geometry: { type: this.shapeDrawType.POINT, coordinates: extentCoords[index] },
          properties: null
      });
    }
    // console.log(data);

    const vectorSource = new VectorSource({
      features: (new GeoJSON()).readFeatures(data.features, {
        featureProjection: this.basemapService.getBaseMapProjection()
      })
    });
    if (op === 'add'){
      // console.log('ADDING BOUNDARY LAYER');
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: this.getAnnotationBoundaryStyle('default')
      });
      vectorLayer.set('name', boundaryLayerName);
      if (!this.commonService.isValid(this.basemap)){
        this.basemap = this.basemapService.getCurrentBasemap();
      }
      this.basemap.addLayer(vectorLayer);
    } else{
      // console.log('UPDATING BOUNDARY LAYER');
      const layerObj: VectorLayer = this.commonService.getLayerOfMap(this.basemap, boundaryLayerName);
      if (this.commonService.isValid(layerObj)){
        layerObj.setSource(vectorSource);
      }
    }
  }

  removePolygonMarkTools(): void{
    this.basemap.removeInteraction(this.draw);
    this.basemap.removeInteraction(this.snap);
    this.basemap.removeLayer(this.raster);
    this.basemap.removeLayer(this.vector);
    this.unListenOnAnnotateToolClicks();
  }

  unListenOnAnnotateToolClicks(): void{
    if (this.commonService.isValid(this.singleClickListenerForAnnotation)){
      unByKey(this.singleClickListenerForAnnotation);
      this.singleClickListenerForAnnotation = null;
    }
    if (this.commonService.isValid(this.dblClickListenerForAnnotation)){
      unByKey(this.dblClickListenerForAnnotation);
      this.dblClickListenerForAnnotation = null;
    }
  }

  removeLayerFromMap(layerName: string, layerId): void{

    console.log(`${layerName}, ${layerId}`);
    const mapObj: OlMap = this.basemapService.getCurrentBasemap();
    const addedLayerObj: VectorLayer = this.commonService.getLayerOfMap(mapObj, layerName);
    // console.log(addedLayerObj);
    if (this.commonService.isValid(addedLayerObj)){
      mapObj.removeLayer(addedLayerObj);
    }

    // REMOVING ANNOTATION RELATED THINGS
    // REMOVING ANNOTATION BOUNDARY
    const annotateLayerBoundaryObj: VectorLayer = this.commonService.getLayerOfMap(mapObj, `${layerName}_boundary`);
    if (this.commonService.isValid(annotateLayerBoundaryObj)){
      mapObj.removeLayer(annotateLayerBoundaryObj);
    }

    // REMOVING ANNOTATION OVERLAY(Save/ Cancel buttons)
    const annotateCloseOptionOverlay = mapObj.getOverlayById(`${layerName}_save`);
    if (this.commonService.isValid(annotateCloseOptionOverlay)){
      mapObj.removeOverlay(annotateCloseOptionOverlay);
    }

    // UNLISTENING POINTER MOVE FOR ANNOTATION LAYER
    mapObj.removeInteraction(this.getCurrAnnotateObj(layerId).modify);
    this.getCurrAnnotateObj(layerId).modify = null;
    if (this.commonService.isValid(this.getCurrAnnotateObj(layerId).modifyListener)){
      unByKey(this.getCurrAnnotateObj(layerId).modifyListener);
    }
    if (this.commonService.isValid(this.getCurrAnnotateObj(layerId).pointerMoveListenerOnAnnotation)){
      unByKey(this.getCurrAnnotateObj(layerId).pointerMoveListenerOnAnnotation);
    }

    const index = this.annotations.findIndex(val => val.id === layerId);
    if (index !== -1){
      this.annotations.splice(index, 1);
    }
    console.log(index);
    console.log(this.annotations);
  }


   createAnnotationSaveOption(id): HTMLDivElement{
    const parentElement = this.renderer.createElement('div');
    this.renderer.setProperty(parentElement, 'id', id);
    this.renderer.setStyle(parentElement, 'margin-left', '10px');
    this.renderer.setStyle(parentElement, 'display', 'none');

    // SAVE BUTTON
    const saveDivElement = this.renderer.createElement('div');
    this.renderer.setProperty(saveDivElement, 'title', 'Save Annotation');
    this.renderer.setStyle(saveDivElement, 'padding', '0 5px');
    this.renderer.setStyle(saveDivElement, 'margin', '2px');
    this.renderer.setStyle(saveDivElement, 'cursor', 'pointer');
    this.renderer.listen(saveDivElement, 'click', (event) => {
      console.log('SAVE CLICKED');
      console.log(event);
      console.log(id);
      this.onSaveAnnotation.next({id});
    });
    const saveImgElement = this.renderer.createElement('img');
    this.renderer.setStyle(saveImgElement, 'width', '15px');
    this.renderer.setProperty(saveImgElement, 'src', 'assets/svgs/geopad/save-icon.svg');
    this.renderer.appendChild(saveDivElement, saveImgElement);

    // CANCEL BUTTON
    const cancelDivElement = this.renderer.createElement('div');
    this.renderer.setProperty(cancelDivElement, 'title', 'Cancel');
    this.renderer.setStyle(cancelDivElement, 'padding', '0 5px');
    this.renderer.setStyle(cancelDivElement, 'margin', '2px');
    this.renderer.setStyle(cancelDivElement, 'cursor', 'pointer');
    this.renderer.listen(cancelDivElement, 'click', (event) => {
      console.log('CANCEL CLICKED');
      console.log(event);
      console.log(id);
      document.getElementById(id + '_confirm').style.display = 'flex';
      document.getElementById(id + '_options').style.display = 'none';
      // this.onCancelAnnotation.next({id});
    });
    const cancelImgElement = this.renderer.createElement('img');
    this.renderer.setStyle(cancelImgElement, 'width', '15px');
    this.renderer.setProperty(cancelImgElement, 'src', 'assets/svgs/geopad/close-icon.svg');
    this.renderer.appendChild(cancelDivElement, cancelImgElement);


    // SAVE AND CANCEL BUTTON CONTAINER
    const saveOptionContainerEle = this.renderer.createElement('div');
    this.renderer.setProperty(saveOptionContainerEle, 'id', id + '_options');
    this.renderer.setStyle(saveOptionContainerEle, 'display', 'flex');
    this.renderer.setStyle(saveOptionContainerEle, 'border', '1px solid #9e9e9e');
    this.renderer.setStyle(saveOptionContainerEle, 'border-radius', '5px');
    this.renderer.appendChild(saveOptionContainerEle, saveDivElement);
    this.renderer.appendChild(saveOptionContainerEle, cancelDivElement);


    /**
     * CLOSE CONFIRM OPTIONS START
     */
    // CLOSE TEXT
    const closeTxtElement = this.renderer.createElement('p');
    this.renderer.appendChild(closeTxtElement, this.renderer.createText('Close?'));
    this.renderer.setStyle(closeTxtElement, 'font-size', '14px');
    this.renderer.setStyle(closeTxtElement, 'margin', '0');
    this.renderer.setStyle(closeTxtElement, 'font-weight', '500');
    this.renderer.setStyle(closeTxtElement, 'background', '#ffffff');
    this.renderer.setStyle(closeTxtElement, 'padding', '0 5px');
    this.renderer.setStyle(closeTxtElement, 'line-height', '24px');

    // CONFIRMED CANCEL BUTTON
    const confirmCancelDivElement = this.renderer.createElement('div');
    this.renderer.setProperty(confirmCancelDivElement, 'title', 'Yes, Cancel');
    this.renderer.setStyle(confirmCancelDivElement, 'padding', '0 5px');
    this.renderer.setStyle(confirmCancelDivElement, 'background', 'orange');
    this.renderer.setStyle(confirmCancelDivElement, 'cursor', 'pointer');
    this.renderer.listen(confirmCancelDivElement, 'click', (event) => {
      console.log('YES CANCEL');
      console.log(event);
      console.log(id);
      this.onCancelAnnotation.next({id});
    });
    const confirmCancelImgElement = this.renderer.createElement('img');
    this.renderer.setStyle(confirmCancelImgElement, 'width', '15px');
    this.renderer.setProperty(confirmCancelImgElement, 'src', 'assets/svgs/geopad/tick-white-icon.svg');
    this.renderer.appendChild(confirmCancelDivElement, confirmCancelImgElement);

    // CLOSE CANCEL BUTTON
    const closeCancelDivElement = this.renderer.createElement('div');
    this.renderer.setProperty(closeCancelDivElement, 'title', 'No, Continue');
    this.renderer.setStyle(closeCancelDivElement, 'padding', '0 5px');
    this.renderer.setStyle(closeCancelDivElement, 'background', '#000000');
    this.renderer.setStyle(closeCancelDivElement, 'cursor', 'pointer');
    this.renderer.listen(closeCancelDivElement, 'click', (event) => {
      console.log('CLOSE CANCEL');
      console.log(event);
      console.log(id);
      document.getElementById(id + '_options').style.display = 'flex';
      document.getElementById(id + '_confirm').style.display = 'none';
    });
    const closeCancelImgElement = this.renderer.createElement('img');
    this.renderer.setStyle(closeCancelImgElement, 'width', '15px');
    this.renderer.setProperty(closeCancelImgElement, 'src', 'assets/svgs/geopad/close-white-icon.svg');
    this.renderer.appendChild(closeCancelDivElement, closeCancelImgElement);

    // CONFIRM CANCEL BUTTONS CONTAINER
    const confirmCancelOptionContainerEle = this.renderer.createElement('div');
    this.renderer.setProperty(confirmCancelOptionContainerEle, 'id', id + '_confirm');
    this.renderer.setStyle(confirmCancelOptionContainerEle, 'display', 'none');
    this.renderer.setStyle(confirmCancelOptionContainerEle, 'border', '1px solid #9e9e9e');
    this.renderer.setStyle(confirmCancelOptionContainerEle, 'border-radius', '5px');
    this.renderer.setStyle(confirmCancelOptionContainerEle, 'overflow', 'hidden');
    this.renderer.appendChild(confirmCancelOptionContainerEle, closeTxtElement);
    this.renderer.appendChild(confirmCancelOptionContainerEle, confirmCancelDivElement);
    this.renderer.appendChild(confirmCancelOptionContainerEle, closeCancelDivElement);
    /**
     * CLOSE CONFIRM OPTIONS END
     */


    this.renderer.appendChild(parentElement, saveOptionContainerEle);
    this.renderer.appendChild(parentElement, confirmCancelOptionContainerEle);
    return parentElement;
  }

}

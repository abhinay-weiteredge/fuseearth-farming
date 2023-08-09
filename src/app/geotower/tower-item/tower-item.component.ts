import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter,
  SimpleChange, HostListener, OnChanges, AfterViewInit } from '@angular/core';
import { ConfigServices } from 'src/app/config.service';
import { GeotowerService } from '../geotower.service';
import { ConfigDataKeys } from '../../config.enum';
import { ActivatedRoute, Event } from '@angular/router';
import { BasemapService } from '../../basemap/basemap.service';
import { ConnectionComponent } from '../tower-item-headers/connection/connection.component';
import { DepictionComponent } from '../tower-item-headers/depiction/depiction.component';
import { FunctionComponent } from '../tower-item-headers/function/function.component';
import { InteractionComponent } from '../tower-item-headers/interaction/interaction.component';
import { SpecificationComponent } from '../tower-item-headers/specification/specification.component';
import { CommonService } from '../../Services/common.service';
import { LayersService } from 'src/app/Services/layers.service';
import { GeobaseService } from 'src/app/Services/geobase.service';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import { getCenter } from 'ol/extent';
import { findIndex } from 'rxjs-compat/operator/findIndex';
import { TowerItemOptionsComponent } from '../tower-item-options/tower-item-options.component';
import { GeotowerComponent } from '../geotower.component';
import {Fill, Style, Stroke} from 'ol/style.js';
import { Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import OlView from 'ol/View';
import { HttpClient, HttpResponse } from '@angular/common/http';
import * as $ from "jquery";



@Component({
selector: 'app-tower-item',
templateUrl: './tower-item.component.html',
styles: [':host{ display:block; }'],
styleUrls: ['./tower-item.component.scss']
})
export class TowerItemComponent implements OnInit, OnChanges {
@Input() layerOrder: number;
@Input() layerIndex: number;
@Input() layersList: any;
// layersList: any[] = [];
@Input() refresh = '';
@Output() towerReloaded: EventEmitter<any> = new EventEmitter<any>();
@Output() showPanToLayer: EventEmitter<boolean> = new EventEmitter<boolean>();
@Output() layersCount: EventEmitter<number> = new EventEmitter<number>();
@Input() isGroup: boolean;
@Output() isAnyLayerOptionsActive: EventEmitter<boolean> = new EventEmitter();
@Output() saveTowerLayer: EventEmitter<any> = new EventEmitter<any>();
@ViewChild('towerItemOption') towerItemOptionEle: ElementRef;
authentication: any;
layersURL: any;
// layerItemOptActive: EventEmitter<any> = new EventEmitter();
// previewIsActive: boolean;
previewLayer: any;
@ViewChild(ConnectionComponent) connectionComp: ConnectionComponent;
@ViewChild(DepictionComponent) depictionComp: DepictionComponent;
@ViewChild(FunctionComponent) functionComp: FunctionComponent;
@ViewChild(InteractionComponent) interactionComp: InteractionComponent;
@ViewChild(SpecificationComponent) specificationComp: SpecificationComponent;
public CONNECTION_HEADER = 'connection';
public DEPICTION_HEADER = 'depiction';
public FUNCTION_HEADER = 'function';
public INTERACTION_HEADER = 'interaction';
public SPECIFICATION_HEADER = 'specification';

@Input() towerWidth: number;
@Input() towerOptionsWidth: number;
@Input() layerOptionsHeight: number;
@Input() isGuest: boolean;
@Input() sessionId;
@Input() towerId;
@Input() layer: any;
private JPG_EXTENSION_CONSTANT = '.jpg';
sliderValue = 75;
private mapLayersList = new Map();
@Input() isDeleteDisable;
@Input() globalObject;
@Output() showPreview: EventEmitter<any> = new EventEmitter<any>();
@Output() sliderVal: EventEmitter<any> = new EventEmitter<any>();
@Input() geoRefOrPreviewClosed = '';
selectedLayerForPreview = '';
@Input() isGeotowerActive;
@Input() geoRefLayerDataToShow: any = {};
searchorhand=true;
showlayerordeletelayer=true;
tableordatabase=true;
selectionorlabel=true;
zoomorpan=true;
showpreview: boolean;
finallayername: any;
showlayervisibility=false;
static isdrag;
@Output() DragvalueChanged = new EventEmitter<any>();
@ViewChild('button') button: ElementRef;
@ViewChild('container') container: ElementRef;
value: any;
dragen: any;
backgroundcolorvalue: any;
backgroundcolorwhitevalue: number;
showslidervalue=false;
firstColor: string;
secondColor: string;
static selectedLayergeometrictype="Notgeometric";
  setcolor: string;
  static towertodepiction: any;

onDragEnded(event) {
// Calculate the height of the button relative to the div
const height = this.button.nativeElement.offsetTop - this.container.nativeElement.offsetTop;
console.log(`Button height: ${height}px` , "lkjjkl");
}

constructor(private configService: ConfigServices, private commonService: CommonService,
        private geotowerService: GeotowerService, private route: ActivatedRoute,
        private basemap: BasemapService, private layersService: LayersService,
        private geobaseService: GeobaseService, private http: HttpClient) { 
          this.firstColor = 'RGB(226, 226, 226, 1)';
          this.secondColor = 'RGB(255, 255, 255)';
        }

ngOnChanges(change: { [key: string]: SimpleChange }): any {
  this.setcolor=DepictionComponent.setoutlinecolorforMP

// this.isDeleteDisable = change.isDeleteDisable.currentValue;
console.log(' is guest ', this.isGuest, change, this.isDeleteDisable);
if (this.commonService.isValid(change.refresh)) {
if (this.commonService.isValid(change.refresh.currentValue)) {
  console.log('REFRESH TOWER DATA');
  // this._getTowerLayerList(this.towerId);
}
}
if (this.commonService.isValid(change.isGuest)) {
if (this.commonService.isValid(change.isGuest.currentValue)) {
  console.log('AUTH STATUS CHANGED');
  if (this.isGuest) {

    this.basemap.getCurrentBasemap().getLayers().forEach(layerObj => {
      if (layerObj !== undefined) {
        const index = this.layersList.findIndex(layer => layer.name === layerObj.values_.name);
        this.finallayername=this.layer.name.toUpperCase( ) 
        if (index !== -1) {
          this.basemap.getCurrentBasemap().removeLayer(layerObj);
        }
      }
    });
    this.layersList = [];
    this.geotowerService.geotowerLayersList = [];
    this.geotowerService.clientObjList = [];
    this._getTowerLayerList(0);
    this.towerReloaded.emit(String(new Date().getTime()));
    this.layersCount.emit(this.layersList.length);
  } else {
    // this._getTowerLayerList(this.towerId);
  }
}
}
if (this.commonService.isValid(change.geoRefOrPreviewClosed)) {
if (this.commonService.isValid(change.geoRefOrPreviewClosed.currentValue)) {
  console.log('REFRESH TOWER DATA');
  this.selectedLayerForPreview = '';
}
}

if (this.commonService.isValid(change.layerList)) {
if (this.commonService.isValid(change.layerList.currentValue)) {
  console.log('REFRESH TOWER DATA');
  this.layer = this.layersList[this.layerIndex];
}
}
}
ngOnInit(): any {
console.log(this);
// this._getTowerLayerList();
// this.getGeobaseInfo();
// this._getTowerLayerList(this.towerId);
if (this.commonService.isValid(this.layersList)) {
this.layer = this.layersList[this.layerIndex];
}


}

@HostListener('window:keyup.esc', ['$event'])
keyEvent(event: KeyboardEvent): any {
console.log('esc clicked!! geotower item component ', event);
this.layersList.forEach(element => {
console.log(element);
console.log('IF');
element.selected = false;
});
}
/* getGeobaseInfo(): any {
this.geotowerService.clientObjList.forEach((clientObj) => {
this.layersList.push(clientObj);
});
if (!this.isGuest) {
// here default geobase getting.. how to find is default or selected geobase session??
console.log('checking the default session or not condition', this.sessionId);
let geobaseId = 0;
let isDefault = true;
if (this.sessionId > 0) {
  geobaseId = this.sessionId;
  isDefault = false;
}
console.log('is default session or opened new session?? ', this.sessionId, geobaseId, isDefault);
this.geobaseService.getGeobase(geobaseId, isDefault)
.subscribe(geobaseInfo => {
  console.log('Got default geobaseInfo info in tower item');
  console.log(geobaseInfo);
  if (!this.commonService.isValid(geobaseInfo)) {
    console.log('No geobaseInfo present');
    // no default geobase for this user..
  } else {
    console.log('geobaseInfo present', geobaseInfo, geobaseInfo.sessionId, geobaseInfo.towerId);
    this._getTowerLayerList(geobaseInfo.towerId);
  }
}, error => {
  console.log('Error while getting geobaseInfo');
  console.log(error);
  if (error.errorCode === 500) {
  }
  this._getTowerLayerList('');
});
}
} */

_getTowerLayerList(towerId): any {
const tempList = [];
if (!this.isGuest) {
this.geotowerService.clientObjList.forEach((clientObj) => {
  // this.layersList.push(clientObj);
  tempList.push(clientObj);
});
}
this.layersList = tempList;
// Here will getAllLayers call API
console.log('Here calling tower-item-option layers list ', this.isGuest, towerId, this.globalObject);
if (!this.isGuest || this.globalObject.pageType === 'share') {
console.log('In getUserWorkSpace');
const email = sessionStorage.getItem('email');
if (this.globalObject.pageType === 'share') {
  towerId = this.globalObject.geobase.towerId;
}
if (this.commonService.isValid(towerId)) {
  this.layersService.getTowerIncludeLayers(towerId, this.isGuest)
    .subscribe(workspaceRes => {
      console.log('Got workspace info');
      console.log(workspaceRes);
      if (!this.commonService.isValid(workspaceRes)) {
        console.log('No workspace present');
      } else {
        console.log('Workspace present');
        let layerList = workspaceRes[0].listOfLayers;
        if (layerList.length > 0) {
          layerList.forEach(layerObj => {
            layerObj.active = false;
            layerObj.selected = false;
            layerObj.previewLayer = false;
            layerObj.isServer = true;
            const index: number = this.geotowerService.prevActiveServerLayersList.
              findIndex(layerName => layerName === layerObj.name);

            if (index !== -1) {
              console.log('prev active layer ', layerObj.name, this.geotowerService.prevActiveServerLayersList);
              layerObj.previewLayer = true;
            }
            layerObj.firebaseUrl = layerObj.url;
            // this.layersList.push(layerObj);
          });
          layerList = this.commonService.sortByDesc(layerList);

          layerList.forEach(layerObj => {
            this.layersList.push(layerObj);
          });
          // if (this.isGeotowerActive){
          if (this.commonService.isValid(this.geoRefLayerDataToShow)){
            if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj)){
              if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj.name)){
                const layerIndex = this.layersList.findIndex(layer => layer.name === this.geoRefLayerDataToShow.layerObj.name);
                console.log(layerIndex);
                console.log(this.layersList[layerIndex]);
                if (layerIndex !== -1){
                  this.showLayer(this.layersList[layerIndex], true);
                  this.geoRefLayerDataToShow = {};
                }
              }
            }
          }
        }
        this.layersCount.emit(this.layersList.length);
      }
      this.towerReloaded.emit(String(new Date().getTime()));
    }, error => {
      console.log('Error while getting workspace');
      console.log(error);
      if (error.errorCode === 500) {
      }
      this.towerReloaded.emit(String(new Date().getTime()));
    });
} else {
  this.towerReloaded.emit(String(new Date().getTime()));
}
this.geotowerService.geotowerLayersList = this.layersList;
} else {
this.towerReloaded.emit(String(new Date().getTime()));
}
this.layersCount.emit(this.layersList.length);
}


public _layerOptionActivateEvent(event, layerGroupObj, maximizeLayerOptions: boolean): any {
console.log('....', layerGroupObj, layerGroupObj.zipfile);
console.log(this);
console.log(this.layersList);
// this.layerItemOptActive.emit(layerGroupObj);
console.log(layerGroupObj.selected);
layerGroupObj.selected = maximizeLayerOptions;
const index = this.layersList.findIndex(layer => layer.layerId === layerGroupObj.layerId);
if(index !== -1){
this.layersList[index].selected = layerGroupObj.selected;
}
console.log(layerGroupObj.selected);
let val = false;
for (const layer of this.layersList) {
if (layer.selected) {
  console.log("LAYER SELECTED");
    val = true;
    break;
}
else{
  console.log("LAYER NOT SELECTED");
}
}
console.log(val);
this.isAnyLayerOptionsActive.emit(val);
}

previewIsActiveEmit(e): any {
console.log('IN previewIsActiveEmit');
console.log(e);
const previewIsActive = e.previewIsActive;
this.previewLayer = e.layerData.name;
this.layersList.forEach(element => {
console.log(element);
if (previewIsActive && this.previewLayer === element.name) {
  console.log('IF');
  element.previewLayer = true;
} else if (!previewIsActive && this.previewLayer === element.name) {
  console.log('ELSE');
  element.previewLayer = false;
}
});
}

showItemPropertyWindow(event, layerObj, from): any {
console.log(event);
console.log(layerObj);
if (this.basemap.getCurrentBasemap().getOverlays().array_.length > 0) {
this.basemap.getCurrentBasemap().getOverlays().array_.forEach(overLayObj => {
  console.log(overLayObj,"drtfyghjk")
  if (overLayObj.id === 'CSFDI') {
    this.basemap.getCurrentBasemap().removeOverlay(overLayObj);
  }
});
}
let overLay;
const itemHeaderName = from; // event.toElement.title;
console.log(layerObj, layerObj.proj,"testing layer obj");
// console.log(layerObj.proj.split('PROJCS')[1], ' results ', layerObj.proj.split('PROJCS')[0]);
/* console.log((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1], ' res ', (layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[0]);
console.log(((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1]).split('DATUM')[1], ' results ',
(((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1]).split('DATUM')[1]).split('PROJECTION')[1]);
console.log((((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1]).split('DATUM')[1]).split('PROJECTION')[1].split(''')[1]); */
if (itemHeaderName === this.CONNECTION_HEADER) {
if (this.commonService.isValid(layerObj.proj)) {
  this.connectionComp.setPropertyValues(this._setConnectionPropertyJson(layerObj));
  overLay = this.connectionComp.getConnectionPopup();
}
} else if (itemHeaderName === this.DEPICTION_HEADER) {
if(layerObj.fileType=='.zip')
{if(layerObj.metadata[0].features[0].geometry.type=="Multipolygon" ||"Polygon"){
TowerItemComponent.selectedLayergeometrictype=layerObj.metadata[0].features[0].geometry.type;
console.log(layerObj, 'layer obj depiction')
console.log(this.setcolor,"check colorrr")
// const style = new Style(
//   {
//     fill: new Fill{
//       color: hh

//     },
//   }
// );
// const fill = new Fill({
//   color: 'rgba(255, 255, 255, 1)'
// });
// const stroke = new Stroke({
//   // color: '#319FD3',
//   color: DepictionComponent.setoutlinecolorforMP,
//   width: 1
// });
// const vectorLayer = new VectorLayer({
 
//   /* style: this.getShapeStyle() */
//   style: new Style({
//     fill,
//     stroke,
//   }),
// // });

TowerItemComponent.towertodepiction=layerObj
}
else if(layerObj.metadata[0].features[0].geometry.type=="Point"){
  TowerItemComponent.selectedLayergeometrictype=layerObj.metadata[0].features[0].geometry.type;
}
else if(layerObj.metadata[0].features[0].geometry.type=="LineString" || "PolyLine"){
  TowerItemComponent.selectedLayergeometrictype=layerObj.metadata[0].features[0].geometry.type;
}
else {
  TowerItemComponent.selectedLayergeometrictype="Notgeometric"
}}
else {
  TowerItemComponent.selectedLayergeometrictype="Notgeometric"
}
this.depictionComp.setPropertyValues(this._setDepictionPropertyJson());
overLay = this.depictionComp.getDepctionPopup();
} else if (itemHeaderName === this.FUNCTION_HEADER) {
this.functionComp.setPropertyValues(this._setFunctionPropertyJson());
overLay = this.functionComp.getFunctionPopup();
} else if (itemHeaderName === this.INTERACTION_HEADER) {
this.interactionComp.setPropertyValues(this._setInteractionPropertyJson(layerObj));
overLay = this.interactionComp.getInteractionPopup();
} else if (itemHeaderName === this.SPECIFICATION_HEADER) {
this.specificationComp.setPropertyValues(this._setSpecificationPropertyJson(layerObj));
overLay = this.specificationComp.getSpecificationPopup();
}
if (this.commonService.isValid(overLay)) {
  console.log(this.basemap.getCurrentBasemap().getView().getCenter(),"testlocations");

  
overLay.setPosition(this.basemap.getCurrentBasemap().getView().getCenter());
overLay.getElement().classList.add("popup-left");
overLay.id = 'CSFDI';
this.basemap.getCurrentBasemap().addOverlay(overLay);
}
}
isValid(str): any {
return this.commonService.isValid(str);
}

_setConnectionPropertyJson(layerObj): any {
let projection = '-';
let datum = '-';
let prjCoodSys = '-';
if (layerObj.proj.split('PROJCS')[1] === undefined) {
datum = ((layerObj.proj.split('PROJCS')[0]).split('GEOGCS')[1]).split('DATUM')[1].split('"')[1];
} else {
projection = (((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1]).split('DATUM')[1]).split('PROJECTION')[1].split('"')[1];
datum = ((layerObj.proj.split('PROJCS')[1]).split('GEOGCS')[1]).split('DATUM')[1].split('"')[1];
prjCoodSys = layerObj.proj.split('PROJCS')[1].split('"')[1];
}
return {
ReferenceType: '',
Datum: datum,
Projection: projection,
CoordinateSystem: prjCoodSys,
Transformation: '-',
GeoFrame: 'OpenLayer',
BoundingBox: ''
};
}

_setSpecificationPropertyJson(layerObj): any {
let storage = '';
if (this.commonService.isValid(layerObj.metadata)) {
if (this.commonService.isValid(layerObj.metadata[0])) {
  storage = layerObj.metadata[0].features[0].geometry.type;
}
}
return {
Represntation: 'Vector',
Source: 'User',
'File Name': layerObj.name,
'File Location': '',
Storage: storage,
Specifics: ''
};
}

_setDepictionPropertyJson(): any {
return {
Symbols: '',
Display: ''
};
}

_setFunctionPropertyJson(): any {
return {
'Attributes/Bands': '',
DataFilter: '-'
};
}

_setInteractionPropertyJson(layerObj): any {
return {
'Date/Time Added': layerObj.timestamp,
'User Initials': '',
Gpad: ''
};
}
getReverseList(list: any[]): any[] {
return list.slice().reverse();
}
saveTowerLayerFun(event): any {
this.saveTowerLayer.emit(event);
}

zoomToLayer(layer): any {
console.log('Layer data for testing ', layer, this.basemap.getCurrentBasemap().getLayers());
this.basemap.setLoadScaleLine();
if (layer.previewLayer) {
let extent = [];
if (layer.isServer && layer.metadata !== null) {
  if (layer.type === 'zip') {
    console.log(layer.metadata);
    this.basemap.getCurrentBasemap().getView().fit(JSON.parse(layer.metadata));
    this.basemap.getCurrentBasemap().getView().setZoom(this.basemap.getCurrentBasemap().getView().getZoom() - 1);
  } else if (layer.type === 'kml') {
    this.basemap.getCurrentBasemap().getLayers().forEach(currentLayer => {
      if (layer.name === currentLayer.values_.name) {
        const extentValue = currentLayer.values_.source.getExtent();
        this.basemap.getCurrentBasemap().getView().fit(extentValue);
        this.basemap.getCurrentBasemap().getView().setZoom(this.basemap.getCurrentBasemap().getView().getZoom() - 1);
      }
    });
  } else {
    console.log(layer.metadata, layer.metadata.split(','), JSON.stringify(layer.metadata));
    let metadataInfo = layer.metadata;
    if (typeof metadataInfo === 'string' && metadataInfo.length > 0) {
      try{
        metadataInfo = window.JSON.parse(metadataInfo);
      } catch (e){
        console.log(e);
      }
    }
    let centerPosition = [0, 0];
    if (metadataInfo.extent !== undefined) {
      extent = metadataInfo.extent;
      centerPosition = getCenter(extent);
    } else {
      extent = layer.metadata.split(',');
      centerPosition = getCenter(extent);
      /* extent.push(Number(extents[0]));
      extent.push(Number(extents[1])); */
    }
    /* this.basemap.getCurrentBasemap().values_.view.setCenter(centerPosition);
    this.basemap.getCurrentBasemap().getView().setZoom(8); */
    this.basemap.getCurrentBasemap().getView().fit(extent);
    this.basemap.getCurrentBasemap().getView().setZoom(this.basemap.getCurrentBasemap().getView().getZoom() - 1);
  }
} else {
  this.basemap.getCurrentBasemap().getLayers().forEach(currentLayer => {
    console.log(currentLayer);
    if (layer.name === currentLayer.values_.name) {
      let extentValue: any;
      if (layer.fileType === 'url') {
        // extentValue = currentLayer.values_.extent;
        extentValue = currentLayer.values_.source.getExtent();
      } else if (layer.fileType === this.JPG_EXTENSION_CONSTANT) {
        extentValue = currentLayer.values_.source.getImageExtent();
      } else {
        extentValue = currentLayer.values_.source.getExtent();
      }
      this.basemap.getCurrentBasemap().getView().fit(extentValue);
      this.basemap.getCurrentBasemap().getView().setZoom(this.basemap.getCurrentBasemap().getView().getZoom() - 1);
    }
  });
}
} else {
// alert('Please select Layer preview ');
// alert('Please turn the layer on, before zooming to it.');
this.showLayer(layer);

setTimeout(() => {
  this.zoomToLayer(layer);
}, 500);
}
}
showLayer(layer, preview: boolean = null): any {
// console.log(event);
console.log(this);
this.showlayervisibility=!this.showlayervisibility
console.log(this.showlayervisibility,"showlayertest")
console.log(layer.previewLayer);
let previewLayer = !layer.previewLayer;

if (this.commonService.isValid(preview)){
previewLayer = preview;
}
// let isLayerVisible = false;
// this.basemap.getCurrentBasemap().getLayers().forEach(currentLayer => {
//   console.log(currentLayer);
//   if (layer.name === currentLayer.values_.name && currentLayer.values_.visible) {
//     isLayerVisible = true;
//   }
// });
// if (isLayerVisible) {
//   console.log('LAYER VISIBLE. SO SET IT TO INVISIBLE');
//   previewLayer = false;
// } else {
//   console.log('LAYER NOT VISIBLE. SO SET IT TO VISIBLE');
//   previewLayer = true;
// }

// console.log('what is the slider value ', this.sliderValue);
const options = {
previewIsActive: previewLayer,
layerObj: layer,
// previewIsActiveEmit: this.previewIsActiveEmit,
mapLayersList: this.mapLayersList, geotowerService: this.geotowerService, sliderValue: this.sliderValue
};
this.previewIsActiveEmit({
previewIsActive: previewLayer,
layerData: layer
});
// this.ngProgress.start();
// if (!this.previewIsActive) {
//   this.previewIsActive = true;
// } else {
//   this.previewIsActive = false;
// }
const index: number = this.geotowerService.prevActiveServerLayersList.
findIndex(layerName => layerName === layer.name);

if (index !== -1) {
console.log('removing the prevLayer ', layer.name, this.geotowerService.prevActiveServerLayersList);
this.geotowerService.prevActiveServerLayersList.splice(index, 1);
}
if (layer.previewLayer) {
this.geotowerService.prevActiveServerLayersList.push(layer.name);
}
this.geotowerService.activateEvent(options, 'DisplayLayer');

}

isConnectionDataAvailable(layer): boolean{
if (layer.fileType === '.jpg'){
if (this.commonService.isValid(layer.metadata.geodata)){
  return true;
} else {
  return false;
}
} else {
return true;
}
}

showPreviewFun(layer): void{
this.showpreview=!this.showpreview
console.log(layer);
// if (layer.fileType === '.jpg'){
//   if (this.commonService.isValid(layer.metadata.geodata)){
//     console.log('DON\'T SHOW PREVIEW');
//   } else {
console.log('SHOW PREVIEW');
this.selectedLayerForPreview = layer.name;
console.log(this.selectedLayerForPreview,'SHOW PREVIEW');
this.showPreview.emit({layer, show: true});
//   }
// } else {
//   console.log('DON\'T SHOW PREVIEW');
// }
}

showLayerCapFun() : any{
if(this.layerIndex > 0){
if(this.layersList[this.layerIndex-1].maximized){
  return true;
}
else{
  return false;
}
}
else if(this.layerIndex === 0){
return true;
}
else{
return false;
}
}
previewORgrouplayer() {
console.log('Long press triggered');
this.searchorhand=!this.searchorhand;
}
showlayerORdeletelayer(){
this.showlayerordeletelayer=!this.showlayerordeletelayer;
}
tableORdatabase(){
this.tableordatabase=!this.tableordatabase;
}
selectionORlabel(){
this.selectionorlabel=!this.selectionorlabel;
}
zoomORpan(){
this.zoomorpan=!this.zoomorpan;
}
pantolayer(){
console.log("i am pan")
this.showPanToLayer.emit(true);
TowerItemOptionsComponent.panToLayer(this.basemap,this.layer)
}
deletelayer(){
console.log(this.layer.layerId,"i am delete")
TowerItemOptionsComponent.deleteLayer(this.layer,this.towerId,this.layersService,this.geotowerService,this.basemap)

}
savelayer(event){
TowerItemOptionsComponent.saveLayer(this.layer,this.basemap)
this.saveTowerLayerFun(TowerItemOptionsComponent.options)
}
tables(){
//TowerItemOptionsComponent.showDBFData(this.layer,this.basemap);
const url = 'http://143.198.234.223/download';

  this.http.get(url, { responseType: 'arraybuffer' })
    .subscribe(response => {
      // Convert the file contents to a string
      const fileContents = String.fromCharCode.apply(null, new Uint8Array(response));
      
      // Save the file contents in the browser's cache
      localStorage.setItem('cachedFile', fileContents);

      console.log('File downloaded and cached successfully');
    });
}
onScroll(event) {
const target = event.target as HTMLDivElement; // Get the target element that fired the event
// Check the direction of scroll
if (target.scrollTop > 0) {
// Scrolling down
this.value--;
} else {
// Scrolling up
this.value++;
}
}
layerSlider(event): any {
const sliderValue = event.target.value;
this.sliderValue = event.target.value;
this.backgroundcolorvalue=this.sliderValue;
this.backgroundcolorwhitevalue=100-this.sliderValue;
console.log(this.sliderValue,"sliderValue")
this.sliderVal.emit(sliderValue);
const layersLength = this.basemap.getCurrentBasemap().getLayers().getLength();
if (layersLength > 0) {
this.basemap.getCurrentBasemap().getLayers().forEach(layerObj => {
  if (layerObj !== undefined) {
    if (layerObj.values_.name === this.layer.name) {
      console.log('current layer ', layerObj, sliderValue);
      layerObj.setOpacity( event.target.value / 100);
    }
  }
});
}
}
dragfeature(drag){
TowerItemComponent.isdrag=drag;
this.dragen=drag;
console.log(TowerItemComponent.isdrag,"this is drag feature value")
this.DragvalueChanged.emit(this.dragen);
if(drag==false){
this.showslidervalue=true;
}
else{
this.showslidervalue=false;
}
}
}

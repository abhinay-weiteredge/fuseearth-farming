import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, SimpleChange, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { ConfigServices } from 'src/app/config.service';
import { CommonService } from 'src/app/Services/common.service';
import { GeobaseService } from 'src/app/Services/geobase.service';
import { LayersService } from 'src/app/Services/layers.service';
import { GeotowerService } from '../geotower.service';
import { ConnectionComponent } from '../tower-item-headers/connection/connection.component';
import { DepictionComponent } from '../tower-item-headers/depiction/depiction.component';
import { FunctionComponent } from '../tower-item-headers/function/function.component';
import { InteractionComponent } from '../tower-item-headers/interaction/interaction.component';
import { SpecificationComponent } from '../tower-item-headers/specification/specification.component';
import { getCenter } from 'ol/extent';
import { MyService } from 'src/app/my-service.service';


@Component({
  selector: 'app-mini-tower-item',
  templateUrl: './mini-tower-item.component.html',
  styleUrls: ['./mini-tower-item.component.scss']
})
export class MiniTowerItemComponent implements OnInit {

  @Input() layerOrder: number;
  @Input() layerIndex: number;
  layerMaximized = false;
  @Input() layersList: any;
  layer: any = {};

  @Input() refresh = '';
  @Output() towerReloaded: EventEmitter<any> = new EventEmitter<any>();
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
  private JPG_EXTENSION_CONSTANT = '.jpg';
  sliderValue = 75;
  private mapLayersList = new Map();
  @Input() isDeleteDisable;
  @Input() globalObject;
  @Output() showPreview: EventEmitter<any> = new EventEmitter<any>();
  @Output() DragvalueChanged2 = new EventEmitter<any>();
  @Input() geoRefOrPreviewClosed = '';
  selectedLayerForPreview = '';
  @Input() isGeotowerActive;
  @Input() geoRefLayerDataToShow: any = {};
  @Output() isMaximized: EventEmitter<any> = new EventEmitter<any>();
  @Output() layernames: EventEmitter<any> = new EventEmitter<any>();

  layerOptionsSelected = false;
  dragen2: any;

  constructor(private configService: ConfigServices, private commonService: CommonService,
              private geotowerService: GeotowerService, private route: ActivatedRoute,
              private basemap: BasemapService, private layersService: LayersService,
              private geobaseService: GeobaseService, private myService: MyService) { }

  ngOnInit(): any {
    console.log(this);
    if (this.commonService.isValid(this.layersList)) {
      this.layer = this.layersList[this.layerIndex];
    }
    console.log(this.layer);
    console.log(this.layer.name,"checkminilayer");
    this.layernames.emit(this.layer.name);
    this.myService.addFileName(this.layer.name);
    // this._getTowerLayerList();
    // this.getGeobaseInfo();
    // this._getTowerLayerList(this.towerId);
  }

  ngOnChanges(change: { [key: string]: SimpleChange }): any {
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

          // this.basemap.getCurrentBasemap().getLayers().forEach(layerObj => {
          //   if (layerObj !== undefined) {
          //     const index = this.layersList.findIndex(layer => layer.name === layerObj.values_.name);
          //     if (index !== -1) {
          //       this.basemap.getCurrentBasemap().removeLayer(layerObj);
          //     }
          //   }
          // });
          // this.layersList = [];
          this.geotowerService.geotowerLayersList = [];
          this.geotowerService.clientObjList = [];
          // this._getTowerLayerList(0);
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

  @HostListener('window:keyup.esc', ['$event'])
    keyEvent(event: KeyboardEvent): any {
    console.log('esc clicked!! geotower item component ', event);
    this.layersList.forEach(element => {
    console.log(element);
    console.log('IF');
    element.selected = false;
    });
  }

  // _getTowerLayerList(towerId): any {
  //   const tempList = [];
  //   if (!this.isGuest) {
  //     this.geotowerService.clientObjList.forEach((clientObj) => {
  //       // this.layersList.push(clientObj);
  //       tempList.push(clientObj);
  //     });
  //   }
  //   this.layersList = tempList;
  //   // Here will getAllLayers call API
  //   console.log('Here calling tower-item-option layers list ', this.isGuest, towerId, this.globalObject);
  //   if (!this.isGuest || this.globalObject.pageType === 'share') {
  //     console.log('In getUserWorkSpace');
  //     const email = sessionStorage.getItem('email');
  //     if (this.globalObject.pageType === 'share') {
  //       towerId = this.globalObject.geobase.towerId;
  //     }
  //     if (this.commonService.isValid(towerId)) {
  //       this.layersService.getTowerIncludeLayers(towerId, this.isGuest)
  //         .subscribe(workspaceRes => {
  //           console.log('Got workspace info');
  //           console.log(workspaceRes);
  //           if (!this.commonService.isValid(workspaceRes)) {
  //             console.log('No workspace present');
  //           } else {
  //             console.log('Workspace present');
  //             let layerList = workspaceRes[0].listOfLayers;
  //             if (layerList.length > 0) {
  //               layerList.forEach(layerObj => {
  //                 layerObj.active = false;
  //                 layerObj.selected = false;
  //                 layerObj.previewLayer = false;
  //                 layerObj.isServer = true;
  //                 layerObj.maximized = false;
  //                 const index: number = this.geotowerService.prevActiveServerLayersList.
  //                   findIndex(layerName => layerName === layerObj.name);

  //                 if (index !== -1) {
  //                   console.log('prev active layer ', layerObj.name, this.geotowerService.prevActiveServerLayersList);
  //                   layerObj.previewLayer = true;
  //                 }
  //                 layerObj.firebaseUrl = layerObj.url;
  //                 // this.layersList.push(layerObj);
  //               });
  //               layerList = this.commonService.sortByDesc(layerList);

  //               layerList.forEach(layerObj => {
  //                 this.layersList.push(layerObj);
  //               });
  //               // if (this.isGeotowerActive){
  //               if (this.commonService.isValid(this.geoRefLayerDataToShow)){
  //                 if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj)){
  //                   if (this.commonService.isValid(this.geoRefLayerDataToShow.layerObj.name)){
  //                     const layerIndex = this.layersList.findIndex(layer => layer.name === this.geoRefLayerDataToShow.layerObj.name);
  //                     console.log(layerIndex);
  //                     console.log(this.layersList[layerIndex]);
  //                     if (layerIndex !== -1){
  //                       this.showLayer(this.layersList[layerIndex], true);
  //                       this.geoRefLayerDataToShow = {};
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //             this.layersCount.emit(this.layersList.length);
  //           }
  //           this.towerReloaded.emit(String(new Date().getTime()));
  //         }, error => {
  //           console.log('Error while getting workspace');
  //           console.log(error);
  //           if (error.errorCode === 500) {
  //           }
  //           this.towerReloaded.emit(String(new Date().getTime()));
  //         });
  //     } else {
  //       this.towerReloaded.emit(String(new Date().getTime()));
  //     }
  //     this.geotowerService.geotowerLayersList = this.layersList;
  //   } else {
  //     this.towerReloaded.emit(String(new Date().getTime()));
  //   }
  //   this.layersCount.emit(this.layersList.length);
  // }

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
        if (overLayObj.id === 'CSFDI') {
          this.basemap.getCurrentBasemap().removeOverlay(overLayObj);
        }
      });
    }
    let overLay;
    const itemHeaderName = from; // event.toElement.title;
    console.log(layerObj, layerObj.proj);
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
      overLay.setPosition(this.basemap.getCurrentBasemap().getView().getCenter());
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
  barclicked(event){
    console.log(event,"minitower")
    this.dragen2=event;
    this.DragvalueChanged2.emit(this.dragen2);
  }
  showPreviewFun(layer): void{
    console.log(layer,"layername");
    // if (layer.fileType === '.jpg'){
    //   if (this.commonService.isValid(layer.metadata.geodata)){
    //     console.log('DON\'T SHOW PREVIEW');
    //   } else {
    console.log('SHOW PREVIEW');
    this.selectedLayerForPreview = layer.name;
    this.showPreview.emit({layer, show: true});
    //   }
    // } else {
    //   console.log('DON\'T SHOW PREVIEW');
    // }
  }

  maximizeLayer(): any{
    console.log('In Maximize Layer');
    this.layerMaximized = true;
    this.layer.maximized = true;
    this.layersList[this.layerIndex].maximized = true;
    this.isMaximized.emit({layer: this.layer, index: this.layerIndex, maximized: true});
  }
  minimizeLayer(): any{
    console.log('In Minimize Layer');
    this.layerMaximized = false;
    this.layer.maximized = false;
    this.layer.selected = false;
    this.layersList[this.layerIndex].maximized = false;
    this.layersList[this.layerIndex].selected = false;
    this.isMaximized.emit({layer: this.layer, index: this.layerIndex, maximized: false});
  }

  layerItemOptActive(e): any {
    console.log(e);
    this.layerOptionsSelected = e;
    this.isAnyLayerOptionsActive.emit(e);
  }
  toogleLayerFromCoin(layer): any {
    console.log('what is the Layer ', layer, layer.name);
    // layers turn ON/OFF when double click on coin
    this.basemap.getCurrentBasemap().getLayers().forEach(currentLayer => {
      console.log('inside loop-1 ', layer.name, currentLayer.values_.name, currentLayer.getVisible());
      if (layer.name === currentLayer.values_.name) {
        console.log('inside loop ', currentLayer.getVisible());
        currentLayer.setVisible(!currentLayer.getVisible());
      }
    });
  }
 
}

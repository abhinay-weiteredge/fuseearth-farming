import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, SimpleChange, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { ConfigServices } from '../../config.service';
import { BasemapService } from '../../basemap/basemap.service';
import { NgProgress } from 'ngx-progressbar';
import { GeotowerService } from '../geotower.service';
import { ActivatedRoute } from '@angular/router';
import { DbfTableComponent } from '../tower-item-headers/dbf-table/dbftable.component';
import { LayersService } from 'src/app/Services/layers.service';
import { CommonService } from 'src/app/Services/common.service';
import {getCenter} from 'ol/extent';
import { interval, Observable, Subscription } from 'rxjs';


@Component({
  selector: 'app-tower-item-options',
  templateUrl: './tower-item-options.component.html',
  styleUrls: ['./tower-item-options.component.scss'],
  styles: [
    ':host{\
      display: block;\
      height: 40px;\
      position: absolute;\
      top: 40px;\
    }'
  ]
})
export class TowerItemOptionsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() layerData: any;
  @Input() isGroup: any;
  clickEventsubscription:Subscription;
  // @Input() layerItemOptActive: EventEmitter<any>;
  @Input() groupLayerItemOptActive: EventEmitter<any>;
  @ViewChild('layeraction') layeractionEle: ElementRef<HTMLDivElement>;
  @ViewChild('opengroup') opengroupEle: ElementRef;
  @Output() previewIsActiveEmit: EventEmitter<any> = new EventEmitter<boolean>();
  @Output() groupButtonActiveEmit: EventEmitter<any> = new EventEmitter<boolean>();
  @Output() saveTowerLayer: EventEmitter<any> = new EventEmitter<any>();
  @Output() sliderVal: EventEmitter<any> = new EventEmitter<any>();
  previewIsActive = false;
  private mapLayersList = new Map();
  static paramWorkspaceName: any;
  private PREVIEWISACTIVE_CONSTANT = 'previewIsActive';
  private LAYERDATA_CONSTANT = 'layerData';
  @ViewChild(DbfTableComponent) dbftableComp: DbfTableComponent;
  @Output() towerScrollEvent: EventEmitter<any> = new EventEmitter<any>();

  @Input() towerWidth: number;
  @Input() towerOptionsWidth: number;
  sliderValue = 75;
  isServer = false;
  @Input() towerId;
  @Input() isDeleteDisable;
  @Output() collapseRibbon: EventEmitter<any> = new EventEmitter<any>();

  private ZIP_EXTENSION_CONSTANT = '.zip';
  private KML_EXTENSION_CONSTANT = '.kml';
  private JPG_EXTENSION_CONSTANT = '.jpg';
  private TIF_EXTENSION_CONSTANT = '.tif';

  lastUsageTimeStamp = new Date().getTime();
  intervalObservable: Observable<number>;
  interValSubs: Subscription;
  intervalDuaration = 5000;
  isHovered = false;
  alertRendered = false;
  static JPG_EXTENSION_CONSTANT: any;
  static alertRendered: boolean;
  
  static showLayer: any;
  
  
  static commonService: any;
  static removeLayerFromMapAndRefreshTower: any;
  static options: { parmWorkspaceName: any; layerObj: any; basemapProjection: any; };
 
  


  constructor(private configService: ConfigServices, private baseMapService: BasemapService,
              private ngProgress: NgProgress, layersService: LayersService,
              private geotowerService: GeotowerService, private route: ActivatedRoute,
              private commonService: CommonService) {
                
               }

  ngOnInit(): any {
    this.intervalObservable = interval(this.intervalDuaration);
    if (!this.commonService.isValid(this.interValSubs)) {
      console.log('DATA QUERY INTERVAL NOT EXIST. SO INITIATING.');
      this.startInterval();
    } else {
      console.log('DATA QUERY INTERVAL EXIST.');
    }
    
  }

  ngOnDestroy(): void{
    console.log('IN DESTROY');
    try{
      this.closeInterval();
      this.intervalObservable = null;
    } catch (e) {
      console.log(e);
    }
  }
  mouseEnter(): void{
    // console.log('IN mouseEnter');
    this.isHovered = true;
  }
  mouseLeave(): void{
    // console.log('IN mouseLeave');
    this.isHovered = false;
  }
  updateTimeStamp(): void{
    this.lastUsageTimeStamp = new Date().getTime();
    // console.log('LAST USED TIMESTAMP', this.lastUsageTimeStamp);
  }

  closeInterval(): void{
    // console.log('In close interval..');
    if (this.commonService.isValid(this.interValSubs)) {
      this.interValSubs.unsubscribe();
    }
  }

 

  startInterval(): void{
    // console.log('In start interval');
    if (this.commonService.isValid(this.interValSubs)) {
      this.interValSubs.unsubscribe();
    }
    this.interValSubs = this.intervalObservable.subscribe(res => {
        // console.log(this.intervalObservable);
        // console.log(res);
        // console.log('CALCULATE IDEL TIME..');
        const currTs = new Date().getTime();
        // console.log(currTs - this.lastUsageTimeStamp);
        if (currTs - this.lastUsageTimeStamp > 5000){
          // console.log('RIBBON OPENED JUST NOW');
          if (this.isHovered){
            // console.log('BUT CURSOR IS ON');
          } else if (this.alertRendered){
            // console.log('BUT ALERT RENDERED');
          } else{
            this.collapseRibbon.emit('close');
            // console.log('EMIT TO CLOSE RIBBON');
          }
        } else {
          // console.log('RIBBON OPENED JUST NOW');
        }
    });
  }

  ngAfterViewInit(): void{
    console.log('what is isDeleteDisable value ', this.isDeleteDisable);
    if (!this.isGroup/*this.layerItemOptActive*/) {
      // this.layerItemOptActive.subscribe(layerGroupObj => {
      const layerGroupObj = this.layerData;
      this.isServer = layerGroupObj.isServer;
      console.log('??? ', layerGroupObj, layerGroupObj.zipfile);
      try{
        console.log(this.layeractionEle);
        console.log(this.layeractionEle.nativeElement.parentElement.parentElement);
        console.log(this.layeractionEle.nativeElement.parentElement.parentElement.id);
        // if (this.layeractionEle.nativeElement.parentElement.id === layerGroupObj.name) {
        // this.layeractionEle.nativeElement.classList.toggle('active');
      } catch (e){
        console.log(e);
      }
      if (!layerGroupObj.isServer) {
         console.log('NOT SERVER');
         if (layerGroupObj.previewLayer) {
            console.log('PREVIEW');
            this.previewIsActive = true;
            // this.isServer = false;
            this.previewIsActiveEmit.emit({ [this.PREVIEWISACTIVE_CONSTANT]: true, [this.LAYERDATA_CONSTANT]: layerGroupObj });
          } else {
            this.previewIsActive = false;
            // this.isServer = true;
          }
       }
    // }
    // });
    } else if (this.isGroup/*this.groupLayerItemOptActive*/) {
      this.groupLayerItemOptActive.subscribe(layerGroupObj => {
        if (this.layeractionEle.nativeElement.offsetParent.id === layerGroupObj.name) {
          // this.layeractionEle.nativeElement.classList.toggle('active');
        }
      });
    }
    const subscribe = this.route.params.subscribe(params => {
      TowerItemOptionsComponent.paramWorkspaceName = params.workspacename;
    });
  }
  ngOnChanges(change: { [key: string]: SimpleChange }): any {
    console.log(' ngon changes what is isDelete disable value ', change, this.isDeleteDisable);
    this.isDeleteDisable = change.isDeleteDisable.currentValue;
  }
  openGroupEvent(event): any {
    if (this.isGroup) {
      const els = Array.prototype.slice.call(this.opengroupEle.nativeElement.classList.toggle('ungroup-btn'), 0);
      const curIdx = els.indexOf(event.currentTarget);
      if (this.opengroupEle.nativeElement.classList.value === 'ungroup-btn') {
        this.groupButtonActiveEmit.emit(true);
      } else {
        this.groupButtonActiveEmit.emit(false);
      }
    }
  }

  showLayer(event): any {
    console.log(event);
    console.log(this);
    console.log(this.previewIsActive);
    console.log('what is the slider value ', this.sliderValue);
    const options = {
      previewIsActive: this.previewIsActive,
      layerObj: this.layerData, previewIsActiveEmit: this.previewIsActiveEmit,
      mapLayersList: this.mapLayersList, geotowerService: this.geotowerService, sliderValue: this.sliderValue
    };

    // this.ngProgress.start();
    if (!this.previewIsActive) {
      this.previewIsActive = true;
    } else {
      this.previewIsActive = false;
    }
    this.geotowerService.activateEvent(options, 'DisplayLayer');
  }

  static saveLayer(layer,basemapser): any {
    TowerItemOptionsComponent.options = {
      parmWorkspaceName: this.paramWorkspaceName,
      layerObj: layer, basemapProjection: basemapser.getBaseMapProjection()
    };
    // this.geotowerService.activateEvent(options, 'SaveData');
   //this.saveTowerLayer.emit( TowerItemOptionsComponent.options);
  }

  layerSlider(event): any {
    const sliderValue = event.target.value;
    this.sliderValue = sliderValue;
    this.sliderVal.emit(sliderValue);
    const layersLength = this.baseMapService.getCurrentBasemap().getLayers().getLength();
    if (layersLength > 0) {
      this.baseMapService.getCurrentBasemap().getLayers().forEach(layerObj => {
        if (layerObj !== undefined) {
          if (layerObj.values_.name === this.layerData.name) {
            console.log('current layer ', layerObj, sliderValue);
            layerObj.setOpacity(sliderValue / 100);
          }
        }
      });
    }
  }

    public static panToLayer(basemapp,layerr): any {
    console.log('Layer data for testing ', layerr, basemapp.getCurrentBasemap().getLayers());
    basemapp.setLoadScaleLine();
    const baseMap = basemapp.getCurrentBasemap();
    const layer = layerr;
    if (layer.previewLayer) {
      const extent = [];
      if (layer.isServer && layer.metadata !== null) {
        if (layer.type === 'zip') {
          console.log(layer.metadata, getCenter(JSON.parse(layer.metadata)));
          // baseMap.getView().fit(JSON.parse(layer.metadata));
          // baseMap.getView().centerOn(getCenter(JSON.parse(layer.metadata)), baseMap.getSize(), [500, 350]);
          baseMap.getView().setCenter(getCenter(JSON.parse(layer.metadata)));
        } else if (layer.type === 'kml') {
          baseMap.getLayers().forEach(currentLayer => {
            if (layer.name === currentLayer.values_.name) {
              const extentValue = currentLayer.values_.source.getExtent();
              // baseMap.getView().fit(extentValue);
              // baseMap.getView().centerOn(getCenter(extentValue), baseMap.getSize(), [500, 350]);
              baseMap.getView().setCenter(getCenter(extentValue));
            }
          });
        } else {
          console.log(layer.metadata, layer.metadata.split(','));
          // const extents = layer.metadata.split(',');
          /* extent.push(Number(extents[0]));
          extent.push(Number(extents[1]));
          baseMap.values_.view.setCenter(extent);
          baseMap.getView().setZoom(8); */
          // baseMap.getView().centerOn(getCenter(extents), baseMap.getSize(), [500, 350]);
          // baseMap.getView().setCenter(getCenter(JSON.parse(layer.metadata)));
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
            centerPosition = getCenter(metadataInfo.extent);
          } else {
            centerPosition = getCenter(layer.metadata.split(','));
            /* extent.push(Number(extents[0]));
            extent.push(Number(extents[1])); */
          }
          baseMap.values_.view.setCenter(centerPosition);
        }
      } else {
        baseMap.getLayers().forEach(currentLayer => {
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
            // baseMap.getView().fit(extentValue);
            // baseMap.getView().centerOn(getCenter(extentValue), baseMap.getSize(), [500, 350]);
            baseMap.getView().setCenter(getCenter(extentValue));
          }
        });
      }
    } else {
      this.alertRendered = true;
      alert('Please turn the layer on, before Pan to Layer to it.');
      this.alertRendered = false;
    }
  }

  private getShpLayerExtent(geoJson, index): any {
    let extent = geoJson.features[index].geometry.coordinates;
    if (extent.length > 0) {
      extent = geoJson.features[index].geometry.coordinates[0];
      if (extent.length !== 2) {
        extent = geoJson.features[index].geometry.coordinates[0][0];
        if (extent.length > 2) {
          extent = geoJson.features[index].geometry.coordinates[0][0][0];
        }
      }
    }
    return extent;
  }

  public static deleteLayer(layerrr,towerId,layerser,geotowerser,basempaser): any {
    this.alertRendered = true;
    const confirmRes = confirm(`Do you want to delete layer with name: ${layerrr.name}`);
    if (confirmRes) {
      console.log('what is event & layerData in Delete Layer', towerId,  layerrr, layerrr.previewLayer);
      
      // this.geotowerService.clientObjList.splice(this.geotowerService.clientObjList.indexOf(this.layerData.name), 1);
      // this.geotowerService.geotowerLayersList.splice(this.geotowerService.geotowerLayersList.indexOf(this.layerData.name), 1);

      // this.geotowerService.activateEvent(options, 'DeleteLayer');
      /* console.log('what is event & layerData ', event, this.layerData,
        this.geotowerService.clientObjList, this.geotowerService.geotowerClientLayersMap, this.geotowerService.geotowerLayersList,
        ); */
      if (layerrr.isServer) {
          layerser.deleteTowerLayerRelation(towerId,layerrr.layerId)
            .subscribe(result => {
              console.log('Deleted towerId LayerId relation', result);
              geotowerser.clientObjList.forEach((obj, index) => {
                if (obj.name === layerrr.name) {
                  geotowerser.clientObjList.splice(index, 1);
                }
              });
              geotowerser.geotowerLayersList.forEach((obj, index) => {
                if (obj.name === layerrr.name) {
                  geotowerser.geotowerLayersList.splice(index, 1);
                }
              });
              // this.geotowerService.activateEvent(options, 'DeleteLayer');
              /* console.log('what is event & layerData ', event, this.layerData,
                this.geotowerService.clientObjList, this.geotowerService.geotowerClientLayersMap, this.geotowerService.geotowerLayersList,
                ); */
              geotowerser.getCurrentBasemap().getLayers().forEach(layer => {
                console.log('delete event layer is ', layer);
                if (layer !== undefined) {
                  if (layer.values_.name === layerrr.name) {
                    console.log('this layer need to delete from map ');
                    basempaser.getCurrentBasemap().removeLayer(layer);
                    if (layerrr.fileType === '.kml' || layerrr.fileType === '.kmz' ||
                        layerrr.fileType === 'kml' || layerrr.fileType === 'kmz') {
                          basempaser.getCurrentBasemap().getLayers().forEach(layer => {
                            if (layer !== undefined) {
                              if (layer.values_.name === layerrr.name  + '_jpg') {
                                console.log('this layer need to delete from map, its kml hidden image map');
                               basempaser.getCurrentBasemap().removeLayer(layer);
                              }
                            }
                          });;
                      }
                  }
                }
              });
              geotowerser.deleteEventTowerRefresh();
              geotowerser.towerScrollEventTrigger();
              if (!this.commonService.isValid(result)) {
                console.log('Layer Deletion from relation table');
              } else {
                console.log('No layer deleted');
              }
            }, error => {
              console.log('Error while Deleting the Layer');
              console.log(error);
              this.alertRendered = true;
              window.alert(`Layer ${layerrr.name} deletion failed...`);
              this.alertRendered = false;
              if (error.errorCode === 500) {
              }
          });
      } else {
        geotowerser.clientObjList.forEach((obj, index) => {
          if (obj.name === layerrr.name) {
            geotowerser.clientObjList.splice(index, 1);
          }
        });
        geotowerser.geotowerLayersList.forEach((obj, index) => {
          if (obj.name === layerrr.name) {
            geotowerser.geotowerLayersList.splice(index, 1);
          }
        });
        // this.geotowerService.activateEvent(options, 'DeleteLayer');
        /* console.log('what is event & layerData ', event, this.layerData,
          this.geotowerService.clientObjList, this.geotowerService.geotowerClientLayersMap, this.geotowerService.geotowerLayersList,
          ); */
        basempaser.getCurrentBasemap().getLayers().forEach(layer => {
          console.log('delete event layer is ', layer);
          if (layer !== undefined) {
            if (layer.values_.name === layerrr.name) {
              console.log('this layer need to delete from map ');
              basempaser.getCurrentBasemap().removeLayer(layer);
              if (layerrr.fileType === '.kml' || layerrr.fileType === '.kmz' ||
                  layerrr.fileType === 'kml' || layerrr.fileType === 'kmz') {
                    basempaser.getCurrentBasemap().getLayers().forEach(layer => {
                      if (layer !== undefined) {
                        if (layer.values_.name === layerrr.name  + '_jpg') {
                          console.log('this layer need to delete from map, its kml hidden image map');
                         basempaser.getCurrentBasemap().removeLayer(layer);
                        }
                      }
                    });;
                }
            }
          }
        });
        geotowerser.deleteEventTowerRefresh();
        geotowerser.towerScrollEventTrigger();
      }
      this.alertRendered = false;
    } else {
      this.alertRendered = false;
    }
  }

  removeLayerFromMapAndRefreshTower(): void{
    this.geotowerService.clientObjList.forEach((obj, index) => {
      if (obj.name === this.layerData.name) {
        this.geotowerService.clientObjList.splice(index, 1);
      }
    });
    this.geotowerService.geotowerLayersList.forEach((obj, index) => {
      if (obj.name === this.layerData.name) {
        this.geotowerService.geotowerLayersList.splice(index, 1);
      }
    });
    // this.geotowerService.activateEvent(options, 'DeleteLayer');
    /* console.log('what is event & layerData ', event, this.layerData,
      this.geotowerService.clientObjList, this.geotowerService.geotowerClientLayersMap, this.geotowerService.geotowerLayersList,
      ); */
    this.baseMapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('delete event layer is ', layer);
      if (layer !== undefined) {
        if (layer.values_.name === this.layerData.name) {
          console.log('this layer need to delete from map ');
          this.baseMapService.getCurrentBasemap().removeLayer(layer);
          if (this.layerData.fileType === '.kml' || this.layerData.fileType === '.kmz' ||
              this.layerData.fileType === 'kml' || this.layerData.fileType === 'kmz') {
                  this.deleteKMLhiddenJPEGLayerVisibulity(this.layerData.name);
            }
        }
      }
    });
    this.geotowerService.deleteEventTowerRefresh();
    this.geotowerService.towerScrollEventTrigger();
  }
  deleteKMLhiddenJPEGLayerVisibulity(kmlFileName): any {
    this.baseMapService.getCurrentBasemap().getLayers().forEach(layer => {
      if (layer !== undefined) {
        if (layer.values_.name === kmlFileName  + '_jpg') {
          console.log('this layer need to delete from map, its kml hidden image map');
          this.baseMapService.getCurrentBasemap().removeLayer(layer);
        }
      }
    });
  }

  static showDBFData(layer,basemapser): any {
    // this.showDBFtable = true;
    console.log('what is event and layer data ', layer);
    const featureProperties = [];
    const featurePropertieHeders = [];
    layer.metadata[0].features.forEach((feature, index) => {
      if (index === 0) {
        for (const [key, value] of Object.entries(feature.properties)) {
          featurePropertieHeders.push(key);
        }
      }
      featureProperties.push(feature.properties);
    });
    console.log('final dbf data is ', featureProperties, featurePropertieHeders);
    if (basemapser.getCurrentBasemap().getOverlays().array_.length > 0) {
      basemapser.getCurrentBasemap().getOverlays().array_.forEach(overLayObj => {
        if (overLayObj.id === 'dbftable') {
          basemapser.getCurrentBasemap().removeOverlay(overLayObj);
        }
      });
    }
    let overLay;
    DbfTableComponent.setPropertyValues(featureProperties, featurePropertieHeders);
    overLay = DbfTableComponent.getdbfTablePopup();
    overLay.setPosition(basemapser.getCurrentBasemap().getView().getCenter());
    overLay.id = 'dbftable';
    basemapser.getCurrentBasemap().addOverlay(overLay);
    // const popupComp = this.popupComponent;
    // this._overlay = popupComp.getGeoPopup();
    // popupComp.setContent('multi-layer-info', featureProperties);
    // this._overlay.setPosition(evt.coordinate);
    // this.basemap.addOverlay(this._overlay);
  }
}

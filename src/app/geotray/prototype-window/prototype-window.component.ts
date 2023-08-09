import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BasemapService } from 'src/app/basemap/basemap.service';
import OlMap from 'ol/Map';
import { DragBox } from 'ol/interaction.js';
import { platformModifierKeyOnly } from 'ol/events/condition.js';
import { Select } from 'ol/interaction';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { unByKey } from 'ol/Observable.js';
import { CommonService } from '../../Services/common.service';
//import { PrototypePopupComponent } from '../prototype-popup/prototype-popup.component';
import { features } from 'process';
import Overlay from 'ol/Overlay';
import {containsExtent} from 'ol/extent';
import CircleStyle from 'ol/style/Circle';
import {MatExpansionModule} from '@angular/material/expansion';
import {Heatmap as HeatmapLayer} from 'ol/layer';
import Text from 'ol/style/Text';



@Component({
  selector: 'app-prototype-window',
  templateUrl: './prototype-window.component.html',
  styleUrls: ['./prototype-window.component.scss']
})
export class PrototypeWindowComponent implements OnInit, OnChanges {
  private basemap: OlMap;
  private dragBox: any;
  private select: any;
  private overlay: any;
  // this hilightFeature for removing hilights and showing shilights of features..
  private hilightFeatures: any;
  selectClick: any;
  basemapProjection: any;
  listener: any;
  vectorLayer: VectorLayer;
  vectorSource: VectorSource = new VectorSource();
  commonService = new CommonService();
  open = false;
  showImage = false;
  close() {
    this.open = false;
  }
  panelOpenState = false;
  @Input() onPropertiesClicked;
  @Input() onPredefinedClicked;
  @Input() onClassifiedClicked;
  @Input() onBlendedClicked;
  @Input() onCollocatedClicked;
  @Input() onExtendedClicked;
  @Input() onslopeClicked;
  @Input() onBufferToolClicked;
  //@ViewChild(PrototypePopupComponent) popupComponent: PrototypePopupComponent;  
  @ViewChild('container') _containerEl: ElementRef<HTMLDivElement>;
  onDataSelection: any;
  popupDataList: any ;
  @Input() largPopupData: any = {
    src: '../../assets/svgs/geo-tray/Massachusetts-Institute-of-Technology.webp',
    title: '',
    text: '',
    address1: '',
    address2: '',
    address3: '',
  };
  prototypePopupActive = false;
  showPopup = false;
  showStatsPopup = false;
  boundaryOptions = ['Boundary', 'State', 'County', 'City', 'Radius'];
  selectedBoundary = 'Boundary';
  @Input() classifiedDesc = true;
  @Input() blendedDesc = true;
  zoomLevel;
  alabamaStats = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2Falabama_stats.png?alt=media&token=b61db0d9-9761-4876-9650-6dfffffca7c8';
  constructor(private basemapService: BasemapService) { 
    this.basemap = this.basemapService.getCurrentBasemap();
    this.basemapProjection = this.basemap.getView().getProjection().code_;
  }

  ngOnInit(): void {
    console.log("hiiii in property window", this.onPredefinedClicked, this.onBlendedClicked)
    this.getFeatureInfoByPolygone(this);
    
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.classifiedDesc = true;
    this.blendedDesc = true;
    console.log('what changes are here ', changes, this.onPredefinedClicked, this.onBlendedClicked);
    this.setToogleVisibulity('HBCUs_Lat_long.xlsx', true);
    if(this.onPredefinedClicked) {      
      if(this.zoomLevel == 1) {
        this.selectedBoundary = 'State';
        this.setToogleVisibulity('StatewideShapes_IHE_Data', true);
        this.loadStateLayerWith_HBCUs_IHEsData('StatewideShapes_IHE_Data', 'IHEs');
        this.setToogleVisibulity('AlabamaStateOnly', false);
        this.setToogleVisibulity('AlabamaCounties', false);
      } else if(this.zoomLevel == 2) {
        this.selectedBoundary = 'County';
        // this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
        this.setToogleVisibulity('AlabamaStateOnly', true);
        this.setToogleVisibulity('AlabamaCounties', false);
      }
    }
    if(this.onClassifiedClicked) {
      this.setToogleVisibulity('StatewideShapes_IHE_Data', true);
      // need to set boundary value
      if(this.zoomLevel == 1) {
        this.selectedBoundary = 'State';
        this.loadStateLayerWith_HBCUs_IHEsData('StatewideShapes_IHE_Data', 'default');
        this.setToogleVisibulity('AlabamaStateOnly', false);
        this.setToogleVisibulity('AlabamaCounties', false);
      } else if(this.zoomLevel == 2) {
        this.selectedBoundary = 'County';
        this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      }
    }
    if(this.onExtendedClicked) {
      this.setToogleVisibulity('StatewideShapes_IHE_Data', true);
      this.setToogleVisibulity('County_PopRanks', false);
      this.selectedBoundary = 'County';
      console.log("checkslopehit",this.onExtendedClicked)

    }
    if(this.onslopeClicked){
      console.log("checkslopehit",this.onslopeClicked)
    }
    if(this.onBlendedClicked) {
      console.log('blended clicked do heatmap activate...');
      this.loadStateLayerWith_HBCUs_IHEsData('StatewideShapes_IHE_Data', 'default');
      this.selectedBoundary = 'Radius';
    } else {
      this.setToogleVisibulity('heatmap', false);
    }
    if(this.onCollocatedClicked) {
      this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      this.setToogleVisibulity('HBCUs_Lat_long.xlsx', false);
      this.setToogleVisibulity('AlabamaStateOnly', false);
      this.setToogleVisibulity('AlabamaCounties', false);
      this.loadStateLayerWithCollocatedData('CollocateSymbolData');
      this.selectedBoundary = 'Radius';
    } else {
      this.setToogleVisibulity('CollocateSymbolData', false);
    }
    this.basemap.getView().on('change:resolution', (event) => {
      console.log("zoom changed", event);
      console.log('what is the zoom level Here? ', this.basemap.getView().getZoom());
      if(this.basemap.getView().getZoom() >= 9) {
        this.zoomLevel = 3;
      } else if(this.basemap.getView().getZoom() < 7) {
        this.zoomLevel = 1;
      } else if(this.basemap.getView().getZoom() >= 7) {
        this.zoomLevel = 2;
      }
  });
  }
  openImage(popupData){
    console.log('popup inside ', popupData);
     this.showImage = true;
     console.log(this.showImage)
     this.largPopupData = popupData;
  }
  changeLayerTypes(layerType): any {
    console.log('layer Type is ', layerType);
    if(layerType === 'County' && this.onExtendedClicked && this.basemap.getView().getZoom() >= 7) {
      this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      this.setToogleVisibulity('City_PopRanks', false);
      this.setToogleVisibulity('County_PopRanks', true);
    } else if(layerType === 'City' && this.onExtendedClicked && this.basemap.getView().getZoom() >= 7) {
      this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      this.setToogleVisibulity('County_PopRanks', false);
      this.setToogleVisibulity('City_PopRanks', true);
    }
    /* if(layerType === 'State') {
      // state only visiblue
      this.setToogleVisibulity('StatewideShapes_IHE_Data', true);
      this.setToogleVisibulity('County_PopRanks', false);
    } else if(layerType === 'County') {
      // coounty only visiblue
      this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      this.setToogleVisibulity('County_PopRanks', true);
    } else {
      // Both layers false
      this.setToogleVisibulity('StatewideShapes_IHE_Data', false);
      this.setToogleVisibulity('County_PopRanks', false);
    } */
  }
  setToogleVisibulity(layerName, isVisabulity): any {
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      if(layer.values_.name === layerName) {
        layer.setVisible(isVisabulity);
      }
    });
  }
  loadStateLayerWithCollocatedData(layerName): any {
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      if(layer.values_.name === layerName) {
        // we need to find feature and change the color based on range
        layer.getSource().getFeatures().forEach(feature => {
          layer.setVisible(true);
          const polygoneExtent = feature.getGeometry().getExtent();
          let count = 0;
          const sColor = '#FF0000';
          let fColor = 'rgba(255, 0, 0, 0.8)';
          console.log('count is ', count, feature, feature.values_.Count_);
          feature.setStyle(this.getStyle(sColor, fColor, 2, feature.values_.Count_));
        });
      }
    });
  }
  loadStateLayerWith_HBCUs_IHEsData(layerName, nameOfDataSet): any {
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      if(layer.values_.name === layerName) {
        // we need to find feature and change the color based on range
        layer.getSource().getFeatures().forEach(feature => {
          const polygoneExtent = feature.getGeometry().getExtent();
          let count = 0;
          const sColor = '#FF0000';
          let fColor = 'rgba(255, 255, 255, 1)';
          const textLable = '';
          if(nameOfDataSet === 'HBCUs') {
            count = feature.values_.HBCUs;
            fColor = this.getRangeColors(count);
          } else if(nameOfDataSet === 'IHEs') {
            count = feature.values_.TOTAL;
            fColor = this.getRangeColorsForIHEs(count);
          } else if(nameOfDataSet === 'default') {
          }
          console.log('count is ', count, fColor, feature, feature.values_.TOTAL, feature.values_.HBCUs);
          feature.setStyle(this.getStyle(sColor, fColor));
          if(count > 0) {
            feature.getStyle().getText().setText(count.toString());
          }
          // feature.getStyle().getText().setText(feature.get('TOTAL')); // feature.get('name'));
        });
      }
    });
  }
  setToogleVisibulity_old(layerName, value): any {
    let xlsxFeatures;
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('what is the layer? ', layer, layer.values_.name, layerName, value);
      if(layer.values_.name === 'HBCUs_Lat_long.xlsx') {
        xlsxFeatures = layer.getSource().getFeatures();
      }
    });
    if(this.onClassifiedClicked || this.onPredefinedClicked) {
      this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
        console.log('what is the layer? ', layer, layer.values_.name, layerName, value);
        /* if(layer.values_.name === 'HBCUs_Lat_long.xlsx') {
          xlsxFeatures = layer.getSource().getFeatures();
        } */
        if(layer.values_.name === layerName) {
          layer.setVisible(value);
          //write code for Foreach features with excel file features
          const polygoneFeatures = layer.getSource().getFeatures();
          console.log(layer.getSource().getFeatures());
          console.log(xlsxFeatures);
          layer.getSource().getFeatures().forEach(feature => {
            const polygoneExtent = feature.getGeometry().getExtent();
            let count = 0;
            xlsxFeatures.forEach(xlsxFeature => {
              if (containsExtent(polygoneExtent, xlsxFeature.getGeometry().getExtent())) {
                count = count + 1;
              }
            });
            console.log('count is ', count, feature);
            const sColor = '#FF0000';
            const fColor = this.getRangeColors(count);
            feature.setStyle(this.getStyle(sColor, fColor));
          });
        }
      });
    }
  }
  getStyle(sColor, fColor, width=1, radius=5): any {
    const fill = new Fill({
      color: fColor
    });
    const stroke = new Stroke({
      // color: '#319FD3',
      color: sColor,
      width: width
    });
    const style = new Style({
      image: new CircleStyle({
        fill,
        stroke,
        radius: radius
      }),
      fill,
      stroke,
      text: new Text({
        font: '13px Calibri,sans-serif',
        fill: new Fill({
          color: '#000',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 3,
        }),
      })
    });
    return style;
  }
  getRangeColors(count): any {
    /* blue - 7,7,247 #0707f7 20 +
    pink - 231,14,169 #e70ea9 6 - 19
    red - 255,14,84 #ff0e54 2 - 5
    orange - 250,110,25 #fa6e19 1
    yellow - 255,203,7  #ffcb07 0 */
    let sColor = '#FFFF00';
    let fColor = 'rgba(255, 255, 255, 1)';
    if(count === 0) {
      sColor = '#ffcb07';
      fColor = 'rgba(255,203,7)';
    } else if(count === 1) {
      sColor = '#fa6e19';
      fColor = 'rgba(250,110,25)';
    } else if(5 >= count || count > 1) {
      sColor = '#ff0e54';
      fColor = 'rgba(255,14,84)';      
    } else if(9 >= count || count > 5) {
      sColor = '#e70ea9';
      fColor = 'rgba(231,14,169)';      
    } else {
      sColor = '#0707f7';
      fColor = 'rgba(7,7,247)';
    }
    return fColor;
  }
  getRangeColorsForIHEs(count): any {
    /* blue - 7,7,247 #0707f7 20 +
    pink - 231,14,169 #e70ea9 6 - 19
    red - 255,14,84 #ff0e54 2 - 5
    orange - 250,110,25 #fa6e19 1
    yellow - 255,203,7  #ffcb07 0 */
    let sColor = '#FFFF00';
    let fColor = 'rgba(255, 255, 255, 1)';
    if(50 >= count || count <= 1) {
      sColor = '#ffcb07';
      fColor = 'rgba(255,203,7)';
    } else if(100 >= count || count <= 51) {
      sColor = '#fa6e19';
      fColor = 'rgba(250,110,25)';
    } else if(200 >= count || count < 101) {
      sColor = '#ff0e54';
      fColor = 'rgba(255,14,84)';      
    } else if(300 >= count || count < 201) {
      sColor = '#e70ea9';
      fColor = 'rgba(231,14,169)';      
    } else {
      sColor = '#0707f7';
      fColor = 'rgba(7,7,247)';
    }
    console.log('what is return count and color ', count, sColor, fColor);
    return fColor;
  }

  blendedFunctionality(layerName, value): any {
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('what is the layer? ', layer, layer.values_.name, layerName, value);
      if(layer.values_.name === layerName) {
        layer.setVisible(value);
        //write code for Foreach features and add yellow color
        const polygoneFeatures = layer.getSource().getFeatures();
        layer.getSource().getFeatures().forEach(feature => {
          const polygoneExtent = feature.getGeometry().getExtent();
          const fColor = '#ffcb07';
          const sColor = 'rgba(14, 13, 14, 1)';
          feature.setStyle(this.getStyle(sColor, fColor));
        });
      }
    });
    let xlsxFeatures;
    let xlsxSource;
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('what is the layer? ', layer, layer.values_.name, layerName, value);
      if(layer.values_.name === 'HBCUs_Lat_long.xlsx') {
        xlsxFeatures = layer.getSource().getFeatures();
        xlsxSource = layer.getSource();
      }
    });
    const blur = 40;
    const radius = 20;
    const heatmaplayer = new HeatmapLayer({
      name: 'heatmap',
      title: "HeatMap",
      source: xlsxSource,
      blur: blur,
      radius: radius,
      weight: function (feature) {
        return 16;
      }
    });
    this.basemapService.getCurrentBasemap().addLayer(heatmaplayer);
  }

  selectStyle(feature) {
    console.log('feature color ', feature, feature.get('COLOR'))
    const selected = new Style({
      fill: new Fill({
        color: '#eeeeee',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
    });
    const color = feature.get('COLOR') || '#eeeeee';
    selected.getFill().setColor(color);
    return selected;
  }

  // Code for the selection of data from map
  public getFeatureInfoByPolygone(options): any {
    console.log('Get Property tool activated!', options);
    this.select = new Select({
      Style: this.selectStyle
    });
    this.basemap.addInteraction(this.select);
    this.hilightFeatures = this.select.getFeatures();
    // this.temp_selectClick(options);
    this.dragBox = this._getDrawBox();
    this.basemap.addInteraction(this.dragBox);
    this._onDrawBoxStart();
    this._onDrawBoxEnd(options);
    this.getLayerPropertiesInfo(options);
    return this;
  }
  private _getDrawBox(): DragBox {
    const drawing = new DragBox({
      condition: platformModifierKeyOnly
    });
    return drawing;
  }
  private _onDrawBoxStart(): any {
    this.dragBox.on('boxstart', () => {
      this.hilightFeatures.clear();
    });
  }
  private _getSelectedFeatures(boxExtent): any {
    const selectedFeatures = new Map();
    const basemapLayers = this.basemap.getLayers();
    console.log('after draw list of Layers: ', basemapLayers, boxExtent);
    // As already we have basemap as layer we should get additional layers hence using length > 1.
    basemapLayers.forEach((layer, index) => {
      // console.log('layer.name: ', layer.values_.name, layer.type);
      /** layer.name working - here avoiding basemap  */
      if (index !== 0 && layer.type !== 'TILE' && layer.type !== 'IMAGE'
        && layer.values_.type !== 'IMAGE' && layer.values_.type !== 'URL'
        && layer.values_.name !== 'openstreet' && layer.values_.name !== 'toner'
        && layer.values_.name !== 'satellite' && layer.values_.name !== 'terrain'
        && layer.values_.name !== 'bingsatellite' && layer.values_.name !== 'auto-polygon'
        && layer.values_.visible && layer.values_.name !== 'bingstreet'
        && layer.values_.name !== 'googlestreet' && layer.values_.name !== 'googlesatellite') {
        layer.getSource().forEachFeatureIntersectingExtent(boxExtent, (feature) => {
          // if layer.name doesn't exist you should use layer.id
          const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
            ? selectedFeatures.get(layer.values_.name) : [];
          existingFeaturesByLayer.push(feature);
          this.hilightFeatures.push(feature);
          selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
        });
      }
    });
    return selectedFeatures;
  }
  private _onDrawBoxEnd(options): any {
    this.dragBox.on('boxend', (evt) => {
      const boxExtent = this.dragBox.getGeometry().getExtent();
      const selectedData = this.processPopupData(false, evt, boxExtent);
      console.log(selectedData);
      this.popupDataList = selectedData;
    });
  }
  private processPopupData(popupActive, evt, boxExtent): any {
    // intersect the box are added to the collection of selected features
    if (!this.commonService.isAuthenticated()){
      console.log('NOT AUTHENTICATED');
      return;
    }
    const selectedFeatures = this._getSelectedFeatures(boxExtent);
    console.log('sending to multiLayer data ', selectedFeatures, selectedFeatures.size, selectedFeatures[0]);
    /** this method used for open popup and add to map */
    if (selectedFeatures.size < 1) {
      return;
    }

    if (selectedFeatures.size === 1) {
      let isTestMarker = false;
      selectedFeatures.forEach((key: string, value: string) => {
        console.log(key, value);
        if (value) {
          if (value.includes('observationInstanceId')) {
            isTestMarker = true;
          }
        }
      });
      if (isTestMarker) {
        return;
      }
    }

    let isErrorFound = false;
    selectedFeatures.forEach((key: string, value: string) => {
      console.log(key, value);
      if (value === undefined) {
        isErrorFound = true;
        return;
      }
    });
    if (isErrorFound) {
      return;
    }
    console.log('final selected data to poopup ', selectedFeatures);
    const selectionData = [];
    selectedFeatures.forEach((data, key) => {
      console.log(data);
      console.log('feature name', data[0].values_)
      if(this.onExtendedClicked && key === 'StatewideShapes_IHE_Data') {
        const extent = data[0].getGeometry().getExtent();
        this.basemap.getView().fit(data[0].getGeometry().getExtent());
        // this.setToogleVisibulity('County_PopRanks', true);
        this.setToogleVisibulity('StatewideShapes_IHE_Data', false);    
        this.setToogleVisibulity('AlabamaStateOnly', true);
        this.setToogleVisibulity('AlabamaCounties', true);
        // activate Alabama Stat Popup Here
        this.showStatsPopup = true;
      }
      if(this.onClassifiedClicked && key === 'HBCUs_Lat_long.xlsx') {
        this.loadStateLayerWith_HBCUs_IHEsData('StatewideShapes_IHE_Data', 'HBCUs');               
        this.setToogleVisibulity('AlabamaStateOnly', false);
        this.setToogleVisibulity('AlabamaCounties', false);
        this.classifiedDesc = false;
        if(this.zoomLevel === 2) {       
          this.setToogleVisibulity('AlabamaStateOnly', true);
          this.setToogleVisibulity('AlabamaCounties', true);
        }
      }
      if(this.onExtendedClicked && key === 'HBCUs_Lat_long.xlsx' && this.zoomLevel === 2) {
        this.setToogleVisibulity('CollegeTowns', true);
        this.setToogleVisibulity('StatewideShapes_IHE_Data', false);    
        this.setToogleVisibulity('AlabamaStateOnly', true);
        this.setToogleVisibulity('AlabamaCounties', true);
      }
      if(this.onExtendedClicked && key === 'County_PopRanks' && this.zoomLevel === 2) {
        this.basemap.getView().fit(data[0].getGeometry().getExtent());
      }
      if(this.onBlendedClicked && key === 'HBCUs_Lat_long.xlsx') {        
        this.blendedFunctionality('StatewideShapes_IHE_Data', true);
        this.blendedDesc = false;
      }
      data.forEach(features => {
        console.log(features);
        if(features.values_.id !== undefined) {
          /* const splitData = features.values_.id.split(':');
          const text = features.values_.id.split(':')[1]; */
          /* selectionData.push({
            src: '../../assets/svgs/geo-tray/Massachusetts-Institute-of-Technology.webp',
            title: features.values_.id.split(':')[0],
            text: features.values_.id.split(':')[1],
            address1: splitData[1] + ',' + splitData[2],
            address2: splitData[3],
            address3: ''
          }); */
          selectionData.push({
            src: features.values_.id.ImageURL,
            title: features.values_.id.HBCU,
            text: features.values_.id.HBCU,
            address1: features.values_.id.Address,
            address2: features.values_.id.State + ',' + features.values_.id.City + ',' + features.values_.id.Zip,
            address3: features.values_.id.Phone
          });
          this.largPopupData = selectionData[0];
        }
      });
    });
    if(popupActive && this.onPredefinedClicked) {
      /* const popupComp = this.popupComponent;
        this.overlay = popupComp.getGeoPopup();
        popupComp.setContent(selectionData); */
        console.log('what is coordinates ', evt.coordinate, evt)
        this.overlay = new Overlay({
          element: this._containerEl.nativeElement,
          autoPan: false,
          autoPanAnimation: {
            duration: 250
          },
        });
        // this.overlay.setPosition([evt.coordinate[1], evt.coordinate[0]]);
        this.overlay.setPosition(evt.coordinate);
        // this.basemap.getView().setCenter(e.mapBrowserEvent['coordinate']);
        this.basemap.addOverlay(this.overlay);
        // console.log('get overlays ', this.basemap.getOverlays(), this.basemap.getPixelFromCoordinate(e.mapBrowserEvent['coordinate']));
        this.basemap.getOverlays().forEach((overLay, index) => {
          console.log(overLay);
          if ((this.basemap.getOverlays().getLength() - 1) === index) {
            console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1), overLay.getMap());
            if (parseInt(overLay.rendered.top_, 10) < 227) {
              overLay.element.style.zIndex = '999';
              overLay.element.style.transform = 'rotate(180deg)';
              overLay.element.firstChild.firstChild.style.transform = 'rotate(180deg)';
              // overLay.element.style.top = (parseInt(overLay.rendered.top_, 10) + parseInt(overLay.rendered.top_, 10)) + 'px';
            } else {
              overLay.element.style.zIndex = '1';
              overLay.element.style.transform = 'rotate(0deg)';
              overLay.element.firstChild.firstChild.style.transform = 'rotate(0deg)';
            }
            overLay.element.style.transform = overLay.rendered.transform_;
            /* console.log('View ', overLay, overLay.element.firstChild, overLay.getMap(),
              overLay.getPositioning(), overLay.getOptions().element.clientHeight, window.screen.height); */
          }
        });
        this.showPopup = true;
    } else {      
      this.showPopup = false;
    }
    return selectionData;
  }
  private getLayerPropertiesInfo(options): any {
    this.select.on('select', (e) => {
    });
    this.processAutoDrawPolygone(options);
    return this;
  }

  private processAutoDrawPolygone(options): any {
    const pixcelAdjestmentVal = 5;
    this.listener = this.basemap.on('click', (evt) => {
      const coord = [evt.coordinate[1].toFixed(6), evt.coordinate[0].toFixed(6)];
      const pixcels = this.basemap.getPixelFromCoordinate(coord);

      const midUpTemp = [];
      midUpTemp.push(pixcels[0] + pixcelAdjestmentVal);
      midUpTemp.push(pixcels[1]);

      const pixcelsTopLeft = [];
      pixcelsTopLeft.push(midUpTemp[0]);
      pixcelsTopLeft.push(midUpTemp[1] + pixcelAdjestmentVal);

      const pixcelsTopRight = [];
      pixcelsTopRight.push(midUpTemp[0]);
      pixcelsTopRight.push(midUpTemp[1] - pixcelAdjestmentVal);

      const midDownTemp = [];
      midDownTemp.push(pixcels[0] - pixcelAdjestmentVal);
      midDownTemp.push(pixcels[1]);

      const pixcelsDownLeft = [];
      pixcelsDownLeft.push(midDownTemp[0]);
      pixcelsDownLeft.push(midDownTemp[1] + pixcelAdjestmentVal);

      const pixcelsDownRight = [];
      pixcelsDownRight.push(midDownTemp[0]);
      pixcelsDownRight.push(midDownTemp[1] - pixcelAdjestmentVal);

      const newPixcelsLat = [];
      newPixcelsLat.push(pixcels[0] + pixcelAdjestmentVal);
      newPixcelsLat.push(pixcels[1]);

      const newPixcelsLng = [];
      newPixcelsLng.push(pixcels[0] + pixcelAdjestmentVal);
      newPixcelsLng.push(pixcels[1] + pixcelAdjestmentVal);

      const newPixcelsLatLng = [];
      newPixcelsLatLng.push(pixcels[0]);
      newPixcelsLatLng.push(pixcels[1] + pixcelAdjestmentVal);

      // console.log('get pixcels from coordinates', pixcels, newPixcelsLat, newPixcelsLng, newPixcelsLatLng);
      const changedCoords = this.basemap.getCoordinateFromPixel(pixcels);
      const changedCoordsLat = this.basemap.getCoordinateFromPixel(newPixcelsLat);
      const changedCoordsLng = this.basemap.getCoordinateFromPixel(newPixcelsLng);
      const changedCoordsLatLng = this.basemap.getCoordinateFromPixel(newPixcelsLatLng);
      const changesCoordsTopLeft = this.basemap.getCoordinateFromPixel(pixcelsTopLeft);
      const changesCoordsTopRight = this.basemap.getCoordinateFromPixel(pixcelsTopRight);
      const changesCoordsDownLeft = this.basemap.getCoordinateFromPixel(pixcelsDownLeft);
      const changesCoordsDownRight = this.basemap.getCoordinateFromPixel(pixcelsDownRight);
      const changesCoordsTopMid = this.basemap.getCoordinateFromPixel(midUpTemp);
      const changesCoordsTopDown = this.basemap.getCoordinateFromPixel(midDownTemp);
      const totalcorrds = [[changesCoordsTopLeft[1], changesCoordsTopLeft[0]],
      [changesCoordsTopRight[1], changesCoordsTopRight[0]],
      [changesCoordsDownRight[1], changesCoordsDownRight[0]],
      [changesCoordsDownLeft[1], changesCoordsDownLeft[0]]];
      console.log('total coordinates ', totalcorrds);
      this.drawPolygonOnMap(totalcorrds, options, evt);
    });
  }
  drawPolygonOnMap(coordinates, options, evt): any {
    const polygonFeature = new Feature(
      new Polygon([coordinates]));

    this.vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [polygonFeature]
      }),
      name: 'auto-polygon',
      visible: false
    });
    this.basemap.addLayer(this.vectorLayer);
    console.log('what is here polygone feature ', polygonFeature, this.basemap.getLayers());
    console.log('get extent ', polygonFeature.getGeometry().getExtent());
    const boxExtent = polygonFeature.getGeometry().getExtent();
    this.processPopupData(true, evt, boxExtent);
  }
}

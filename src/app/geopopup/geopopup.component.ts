import { Component, ViewChild, ElementRef, Input, Output, EventEmitter, AfterViewInit, ViewEncapsulation } from '@angular/core';
import Overlay from 'ol/Overlay';
import { GeotrayService } from '../geotray/geotray.service';
import { Select } from 'ol/interaction';

@Component({
  selector: 'app-geopopup',
  templateUrl: './geopopup.component.html',
  styleUrls: ['./geopopup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GeoPopupComponent implements AfterViewInit {

  private _popupOverlay: Overlay;
  @Input() multiLayerContentList = [];
  @Input() featureInfoContentList = [];
  @ViewChild('container') _containerEl: ElementRef<HTMLDivElement>;
  @ViewChild('content') _contentEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  @ViewChild('multiLayerContent') _multiFeatureContentEl: ElementRef;
  @ViewChild('geopadSiteContent') geopadSiteContentEl: ElementRef;
  @ViewChild('featureContent') _featureContentEl: ElementRef;
  @ViewChild('radiusContent') _inputRadiusContentEl: ElementRef;
  @ViewChild('rotateContent') _inputRotateContentEl: ElementRef;
  @Output() onRadiusChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() onRotationAngleChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() closePopupEmit: EventEmitter<any> = new EventEmitter<any>();
  minWidth = 190;
  vertical = 'vertical';
  @Input() headerTitle = '';
  units = 'miles';
  geopadSiteData: any = {};
  // dragPosition = {x: 0, y: 0};

  constructor(private geotrayService: GeotrayService) { }

  ngAfterViewInit(): void { }

  /* public setDragPosition(coordinates) {
    this.dragPosition = {x: this.dragPosition.x + coordinates[0], y: this.dragPosition.y + coordinates[1]};
  } */

  public getGeoPopup() {
    const units = localStorage.getItem('unit');
    if (units === 'us') {
          this.units = 'miles';
        } else if (units === 'metric') {
          this.units = 'km';
        }
    this._popupOverlay = new Overlay({
      element: this._containerEl.nativeElement,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      },
    });
    this._closerEl.nativeElement.onclick = () => {
      // this.close_DestoryTool();
      this.close();
    };
    return this._popupOverlay;
  }

  public close() {
    this._popupOverlay.setPosition(undefined);
    this._closerEl.nativeElement.blur();
    console.log('geotray service ', this.geotrayService.basemapService.getCurrentBasemap());
    this.geotrayService.basemapService.getCurrentBasemap().interactions.forEach((interaction) => {
      if (interaction instanceof Select) {
        interaction.getFeatures().clear();
      }
    });
    return false;
  }

  public close_DestoryTool() {
    this._popupOverlay.setPosition(undefined);
    this._closerEl.nativeElement.blur();
    this.geotrayService.dectivateTools();
    return false;
  }

  public loadFeatureInfoContentData(contentData) {
    this.featureInfoContentList = [];
    let bboxFirstCoordinates;
    let bboxSecondCoordinates;
    contentData.forEach((key, value) => {
      bboxSecondCoordinates = '';
      bboxFirstCoordinates = key;
      if (key instanceof Array) {
        if (key.length === 4) {
          bboxFirstCoordinates = key[0] + ',' + key[1];
          bboxSecondCoordinates = key[2] + ',' + key[3];
        }
      }
      const jsonObj = {
        title: value,
        content: bboxFirstCoordinates,
        contentNextLine: bboxSecondCoordinates
      };
      this.featureInfoContentList.push(jsonObj);
    });
    console.log('final popup tabset data', this.featureInfoContentList);
    console.log(this);
  }

  public loadMultiLayerContentData(contentData, isCovidpage) {
    let isCovidpageValue = false;
    if (isCovidpage === undefined || isCovidpage === 'undefined') {
      isCovidpageValue = false;
    } else {
      isCovidpageValue = true;
    }
    this.multiLayerContentList = [];
    contentData.forEach((feature, layer) => {
      if (feature.length > 0) {
        const content: any = this.parseFeature(feature);
        const tabs = {
          title: layer,
          content,
          length: feature.length,
          isCovidPage: isCovidpageValue,
          tabContent: this.getLayerContent(content, feature.length, layer, isCovidpageValue)
        };
        this.multiLayerContentList.push(tabs);
      }
    });
    console.log('final popup tabset data', this.multiLayerContentList);
  }

  parseFeature(featureObj) {
    const mapFeatureDataList = [];
    featureObj.forEach(element => {
      for (const [key, value] of Object.entries(element.values_)) {
        if (key !== 'geometry') {
          // mapFeatureDataList.push(key + ' : ' + value);
          mapFeatureDataList.push(key + '$FE$' + value);
        }
      }
    });
    return mapFeatureDataList;
  }

  getRadiusValue(event, value) {
    this.onRadiusChange.emit(value);
  }

  getRotateValue(event, value) {
    this.onRotationAngleChange.emit(value);
  }
  public setContent(contentType, contentData, isCovidPage) {
    this._removeChildNode();
    if (contentType === 'multi-layer-info') {
      this.headerTitle = 'Properties';
      this.loadMultiLayerContentData(contentData, isCovidPage);
      this._contentEl.nativeElement.appendChild(this._multiFeatureContentEl.nativeElement);
    } else if (contentType === 'radius-content-info') {
      this.headerTitle = '';
      // console.log('radius-content-info', this._containerEl, this._containerEl.nativeElement.attributes.class.offsetWidth);
      this.minWidth = 100;
      this._inputRadiusContentEl.nativeElement.firstElementChild.value = null;
      this._contentEl.nativeElement.appendChild(this._inputRadiusContentEl.nativeElement);
    } else if (contentType === 'layer-feature-info') {
      this.headerTitle = 'Info';
      this.loadFeatureInfoContentData(contentData);
      this._contentEl.nativeElement.appendChild(this._featureContentEl.nativeElement);
    } else if (contentType === 'rotate-content-info') {
      this.headerTitle = '';
      this.minWidth = 100;
      this._inputRotateContentEl.nativeElement.firstElementChild.value = null;
      this._contentEl.nativeElement.appendChild(this._inputRotateContentEl.nativeElement);
    } else if (contentType === 'geopad-site-info') {
      // {
      //   geopadSiteData.name: data.site.locationName,
      //   desc: data.site.description,
      //   location: data.site.latitudeLongitude,
      //   projectName: data.project.name,
      //   placeName: data.place.name,
      //   topicName: data.topic.name
      // }
      this.geopadSiteData = contentData;
      this.headerTitle = contentData.name;
      this.minWidth = 100;
      this._inputRotateContentEl.nativeElement.firstElementChild.value = null;
      this._contentEl.nativeElement.appendChild(this.geopadSiteContentEl.nativeElement);
    }
  }
  private _removeChildNode() {
    console.log(this._contentEl.nativeElement.childNodes);
    if (this._contentEl.nativeElement.childNodes.length > 0) {
      this._contentEl.nativeElement.removeChild(this._contentEl.nativeElement.childNodes[0]);
    }
  }
  getLayerContent(content, length, title, isCovidPage) {
    try {
      const tempContentParams: any[] = content; // .split(",");
      console.log('content   ', content);
      let data = '<p class="tab-content-body-title"><b>' + title + '</b></p><br><table class="table table-striped"><tbody>';
      if (isCovidPage) {
        // const rowSplit = content[0].substring(content[0].indexOf(':') + 1);
        const rowSplit = content[0].substring(content[0].indexOf('$FE$') + 1);
        console.log('content   ', rowSplit);
        const newRow = rowSplit.split('\n');
        newRow.forEach(rowdata => {
          data = data + '<tr> <td>' + rowdata + '</td> </tr>';
        });
        data = data + '</tbody></table>';
      } else {
        // const rowSplit = content[0].split(':');
        const rowSplit = content[0].split('$FE$');
        tempContentParams.forEach((param, index) => {
          // const temp_param_key_val = param.split(':');
          const temp_param_key_val = param.split('$FE$');
          if (rowSplit[0] === temp_param_key_val[0] && length > 1 && index !== 0) {
            data = data + '</tbody></table><hr class="prop-line"><table class="table table-striped"><tbody>';
          }
          // data = data + '<b>' + temp_param_key_val[0] + ' : </b>' + temp_param_key_val[1] + '<br>';
          data = data + '<tr> <td>' + temp_param_key_val[0] + '</td>';
          data = data + '<td>' + temp_param_key_val[1] + '</td> </tr>';
        });
        data = data + '</tbody></table>';
      }
      return data;
    } catch (e) {
      return 'Unknown';
    }
  }
}

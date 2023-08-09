import { Component, OnInit, Input, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { ConfigServices } from 'src/app/config.service';
import { GeotowerService } from '../geotower.service';
import { ConfigDataKeys } from '../../config.enum';

@Component({
  selector: 'app-tower-group-item',
  templateUrl: './tower-group-item.component.html',
  styleUrls: ['./tower-group-item.component.scss']
})
export class TowerGroupItemComponent implements OnInit {
  @Input() groupList: any[] = [];
  @Input() groupLayersList: any[] = [];
  @ViewChild('group') groupEle: ElementRef;
  @Output() groupButtonChangeTrigger: EventEmitter<any> = new EventEmitter<boolean>();
  private _baseURL: any;
  private _authentication: any;
  private _workSpaceName: any;
  private _layersURL: any;
  previewIsActive: boolean;
  previewLayer: any;
  groupLayerItemOptActive: EventEmitter<any> = new EventEmitter();
  groupLayerActive: boolean = false;
  constructor(private configService: ConfigServices,
    private geotowerService: GeotowerService) { }

  ngOnInit() {
    setTimeout(() => {
      this.settingConfigData();
    }, 500);
  }

  settingConfigData() {
    this._baseURL = this.configService.configData[ConfigDataKeys.baseURL];
    this._authentication = this.configService.configData[ConfigDataKeys.authorization];
    this._workSpaceName = this.configService.configData[ConfigDataKeys.geoserver][ConfigDataKeys.workspaceName];
    this._layersURL = this._baseURL + 'rest/workspaces/' + this._workSpaceName + '/layergroups';
    this.getTowerGroupList();
  }

  getTowerGroupList() {
    this.geotowerService.getLayerData(this._layersURL, this._authentication)
      .subscribe(result => {
        if (result['layerGroups'] !== '') {
          if (result['layerGroups'].layerGroup.length > 0) {
            this.groupList = result['layerGroups'].layerGroup;
          }
        }
      },
        error => {
          console.log('Here Error : Fetching Layers' + error);
        });
  }
  groupActiveEvent(event, layerGroupObj) {
    this.groupLayerActive = !this.groupLayerActive;
    this.groupLayerItemOptActive.emit(layerGroupObj);
    this._groupLayersListData(layerGroupObj);
  }

  groupOptActiveEvent(event, layerGroupObj) {
    layerGroupObj.selected = !layerGroupObj.selected;
    this.groupLayerItemOptActive.emit(layerGroupObj);
  }

  private _groupLayersListData(layerGroupObj) {
    this.groupLayersList = [];
    this.geotowerService.getLayerData(this._layersURL + '/' + layerGroupObj.name, this._authentication)
      .subscribe(result => {
        const layerData = result['layerGroup'].publishables.published;
        if (layerData.length) {
          this.groupLayersList = result['layerGroup'].publishables.published;
          this.groupLayersList.forEach(element => {
            element['icon'] = '../assets/images/status_online.png';
            element['name'] = element['name'].split(':')[1];
            element['selected'] = false;
            element['previewLayer'] = false;
          });
        } else {
          layerData['icon'] = '../assets/images/status_online.png';
          layerData['name'] = layerData['name'].split(':')[1];
          layerData['previewLayer'] = false;
          layerData['selected'] = false;
          this.groupLayersList.push(layerData);
        }
      },
        error => {
          console.log('Here Error : Fetching Layers' + error);
        });
  }
  groupButtonActiveEmit(event) {
    this.groupEle.nativeElement.classList.toggle('active');
    this.groupButtonChangeTrigger.emit(event);
  }

  previewIsActiveEmit(e) {
    this.previewIsActive = e.previewIsActive;
    this.previewLayer = e.layerData.name;
    this.groupLayersList.forEach(element => {
      if (this.previewIsActive && this.previewLayer === element.name) {
        element.previewLayer = true;
      } else if (!this.previewIsActive && this.previewLayer === element.name) {
        element.previewLayer = false;
      }
    });
  }
}

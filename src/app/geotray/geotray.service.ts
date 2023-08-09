import { Injectable } from '@angular/core';
import { BasemapService } from '../basemap/basemap.service';
import { GeometryTool } from './tools/geometry-tool';
import { PositionTool } from './tools/position-tool';
import { PropertyTool } from './tools/property-tool';
import { VicinityTool } from './tools/vicinity-tool';
import { RemarkTool } from './tools/remark-tool';
import { ShareTool } from './tools/share-tool';

@Injectable({
  providedIn: 'root'
})
export class GeotrayService {
  predefinedPopup: boolean;

  setPopup(data){
    this.predefinedPopup = data;
  }
  getPopup(){
    return this.predefinedPopup;
  }
  private _basemap;
  private _toolOptions;
  private _toolRef: any;
  constructor(public basemapService: BasemapService) {
  }

  private _getToolOptions() {
    const basemap = this.basemapService.getCurrentBasemap();
    return {
      GTB: {
        instance: new GeometryTool(basemap),
        clickEvent: 'drawLineCalculateLength',
        ctrlClickEvent: 'getLayerPropertiesInfo',
        destroyEvent: 'destroy',
        clickIcon: 'url(/assets/tool-icons/map-icons/GTB2.svg) 25 25, auto',
        ctrlClickIcon: 'url(/assets/tool-icons/map-icons/GTB.svg) 10 10, auto'
      },
      PTB: {
        instance: new PositionTool(basemap, this.basemapService),
        clickEvent: 'getPosition',
        ctrlClickEvent: 'rotationMap',
        destroyEvent: 'destroy',
        clickIcon: 'url(/assets/tool-icons/map-icons/PTB2.svg) 25 45, auto',
        ctrlClickIcon: 'url(/assets/tool-icons/map-icons/PTB.svg) 25 25, auto'
      },
      QTB: {
        instance: new PropertyTool(basemap),
        clickEvent: 'tempClick',
        ctrlClickEvent: 'getFeatureInfoByPolygone',
        destroyEvent: 'destroy',
        clickIcon: 'auto',
        ctrlClickIcon: 'url(assets/tool-icons/map-icons/QTB.svg) 15 10, auto'
      },
      VTB: {
        instance: new VicinityTool(basemap),
        // clickEvent: 'getFeatureInfoByCircleRadius',
        // ctrlClickEvent: 'getFeatureInfoByCircle',
        destroyEvent: 'destroy',
        // clickIcon: 'url(/assets/tool-icons/map-icons/VTB.svg) 10 10, auto',
        ctrlClickIcon: 'auto'
      },
      RTB: {
        instance: new RemarkTool(basemap),
        clickEvent: 'getEditor',
        ctrlClickEvent: '',
        destroyEvent: 'destroy',
        clickIcon: 'auto',
        ctrlClickIcon: 'auto'
      },
      STB: {
        instance: new ShareTool(basemap),
        clickEvent: 'getShare',
        ctrlClickEvent: '',
        destroyEvent: 'destroy',
        clickIcon: 'auto',
        ctrlClickIcon: 'auto'
      }
    };
  }

  activateTool(toolInfo) {
    this._toolOptions = this._getToolOptions();
    // Calling deactivate tools here to destroy tools on any other geotray tool click.
    // befor activating any tool
    this.dectivateTools();
    this._toolRef = null;
    console.log('activateTool', toolInfo);
    let toolEvent;
    let toolIcon;
    const toolName = toolInfo.title;
    try{
      if (!toolInfo.isCtrlClicked) {
        toolEvent = this._toolOptions[toolName].clickEvent;
        toolIcon = this._toolOptions[toolName].clickIcon;
      } else {
        toolEvent = this._toolOptions[toolName].ctrlClickEvent;
        toolIcon = this._toolOptions[toolName].ctrlClickIcon;
      }
    } catch (e) {
      console.log(e);
    }
    this.basemapService.setMouseIcon(toolIcon);
    this._toolRef = this._toolOptions[toolName].instance[toolEvent](toolInfo);
  }

  dectivateTools() {
    console.log('called deactivateTool', this._toolRef);
    this.basemapService.setMouseIcon('auto');
    if (this._toolRef) {
      this._toolRef.destroy();
    }
  }
}

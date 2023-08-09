import OlMap from 'ol/Map';
import * as OlProj from 'ol/proj';
import { unByKey } from 'ol/Observable.js';
import { BasemapService } from 'src/app/basemap/basemap.service';

export class PositionTool {
  private _listener: any;
  private _overlay: any;
  private _basemapProjection;

  constructor(private basemap: OlMap, private basemapService: BasemapService) {
    this._basemapProjection = this.basemap.getView().getProjection().code_;
  }

  // Click Event on Position tool
  public getPosition(options) {
    console.log('Get position tool activated!');
    this._listener = this.basemap.on('click', (evt) => {
      const coord = [evt.coordinate[1].toFixed(6), evt.coordinate[0].toFixed(6)];
      const propertiesMap = new Map();
      propertiesMap.set('Coordinates', coord);
      propertiesMap.set('Coord System', this._basemapProjection);
      this._popupOperations(options, 'layer-feature-info', propertiesMap, evt.coordinate);
    });
    return this;
  }

  // Ctrl + Click on Position tool
  public rotationMap(options) {
    console.log('Get Ctrl position tool activated!');
    this.basemap.getView().setRotation(Math.PI / 180 * 0);
    this._listener = this.basemap.on('click', (evt) => {
      const returnPopupComp = this._popupOperations(options, 'rotate-content-info', '', evt.coordinate);
      returnPopupComp.onRotationAngleChange.subscribe(rotationValue => {
        this.basemap.getView().setRotation(Math.PI / 180 * rotationValue);
        returnPopupComp.close();
        this.basemapService.setLoadOrientationValue(rotationValue);
      });
    });
    return this;
  }
  /** this method used for open popup and add to map */
  private _popupOperations(options, contentType, content, coordinates) {
    const popupComp = options.popupComponent;
    this._overlay = popupComp.getGeoPopup();
    popupComp.setContent(contentType, content);
    this._overlay.setPosition(coordinates);
    // popupComp.setDragPosition(coordinates);
    // this.basemap.getView().setCenter(coordinates);
    this.basemap.addOverlay(this._overlay);
    this.basemap.getOverlays().forEach((overLay, index) => {
      if ((this.basemap.getOverlays().getLength() - 1) === index) {
        console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 10), overLay.rendered.top_);
        if (parseInt(overLay.rendered.top_, 10) < 227) {
          overLay.element.style.zIndex = '1';
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
    return popupComp;
  }
  public destroy() {
    console.log('position tool destroyed!', this.basemap.getOverlays());
    unByKey(this._listener);
    this.basemap.getView().setRotation(Math.PI / 180 * 0);
    this.basemap.removeOverlay(this._overlay);
    this.basemapService.setLoadOrientationValue(0);
  }
}

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

export class PropertyTool {
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

  constructor(private basemap: OlMap) {
  this.basemapProjection = this.basemap.getView().getProjection().code_;
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
      this.processPopupData(options, evt, boxExtent);
    });
  }

  private processPopupData(options, evt, boxExtent): any {
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
    const popupComp = options.popupComponent;
    this.overlay = popupComp.getGeoPopup();
    popupComp.setContent('multi-layer-info', selectedFeatures, options.isCovidPage);
    this.overlay.setPosition(evt.coordinate);
    this.basemap.addOverlay(this.overlay);
    this.basemap.getOverlays().forEach((overLay, index) => {
      console.log(overLay);
      if ((this.basemap.getOverlays().getLength() - 1) === index) {
        console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1));
        if (parseInt(overLay.rendered.top_, 10) < 227) {
          overLay.element.style.zIndex = '1';
          overLay.element.style.transform = 'rotate(180deg)';
          overLay.element.firstChild.firstChild.style.transform = 'rotate(180deg)';
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

  private temp_selectClick(options): any {
    const globthis = this;
    let prevExistingFeaturesByLayer = [];
    const PrevSelectedFeatures = new Map();
    this.select.on('select', (e) => {
      console.log(e.target, this.hilightFeatures, e.target.getFeatures(), e, e.mapBrowserEvent.coordinate);
      const selectedFeatures = new Map();
      const me = this;
      const features = [];
      const basemapLayers = this.basemap.getLayers();
      const lat = e.mapBrowserEvent.coordinate[0];
      const lng = e.mapBrowserEvent.coordinate[1];
      const dd = [lat, lng];
      console.log('what shift key ', e.mapBrowserEvent.originalEvent);
      // -----
      basemapLayers.forEach((layer, index) => {
        console.log('layer.name: ', layer.values_.name, layer, layer.getSource(), layer.type);
        /** layer.name working - here avoiding basemap  */
        if (index !== 0 && layer.type !== 'TILE' && layer.type !== 'IMAGE'
          && layer.values_.type !== 'IMAGE' && layer.values_.type !== 'URL'
          && layer.values_.name !== 'openstreet' && layer.values_.name !== 'toner'
          && layer.values_.name !== 'satellite' && layer.values_.name !== 'terrain'
          && layer.values_.name !== 'bingsatellite' && layer.values_.name !== 'auto-polygon'
          && layer.values_.visible && layer.values_.name !== 'bingstreet'
          && layer.values_.name !== 'googlestreet' && layer.values_.name !== 'googlesatellite') {
          // layer.getSource().forEachFeatureAtCoordinateDirect(dd, (feature) => {
          layer.getSource().forEachFeatureAtCoordinateDirect(dd, (feature) => {
            console.log('what is prev feature Here???? ', selectedFeatures, PrevSelectedFeatures);
            if (e.mapBrowserEvent.originalEvent.shiftKey) {
              const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
                ? selectedFeatures.get(layer.values_.name) : [];
              prevExistingFeaturesByLayer.push(feature);
              existingFeaturesByLayer.push(feature);
              /* prevExistingFeaturesByLayer.forEach((prevFeature) => {
                existingFeaturesByLayer.push(prevFeature);
              }); */
              selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
              PrevSelectedFeatures.forEach((value, key) => {
                console.log('values ', key, value);
                if (key === layer.values_.name) {
                  value.push(feature);
                  console.log('what is the this????? ', value);
                  PrevSelectedFeatures.set(key, value);
                }
              });
              // PrevSelectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
              console.log('clicked on shift key... ', selectedFeatures, PrevSelectedFeatures);
            } else {
              const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
                ? selectedFeatures.get(layer.values_.name) : [];
              existingFeaturesByLayer.push(feature);
              prevExistingFeaturesByLayer = [];
              prevExistingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
                ? selectedFeatures.get(layer.values_.name) : [];
              selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
              PrevSelectedFeatures.clear();
              selectedFeatures.forEach((value, key) => {
                console.log('values ', key, value);
                PrevSelectedFeatures.set(key, value);
              });
              console.log('clicked on Click... ', selectedFeatures, PrevSelectedFeatures);
            }
          });
        }
      });
      // -----
      // As already we have basemap as layer we should get additional layers hence using length > 1.
      /* basemapLayers.forEach((layer, index) => {
        console.log('layer.name: ', layer.values_.name, layer.ol_uid);
        // layer.name working - here avoiding basemap
        if (index !== 0) {
          e.target.getFeatures().forEach(function (feature) {
            console.log('inside e,target ', e.target, e, layer);
            const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
              ? selectedFeatures.get(layer.values_.name) : [];
            existingFeaturesByLayer.push(feature);
            // globthis._hilightFeatures.push(feature);
            selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
            console.log('selected layers ', selectedFeatures);
          });
        }
      });
      e.target.getFeatures().forEach(function (feature) {
        let layerName;
        Object.entries(e.target.featureLayerAssociation_).forEach((value) => {
          // console.log('what is values here ', value[1]['values_']['name']);
          layerName = value[1]['values_']['name'];
        });
        const existingFeaturesByLayer = selectedFeatures.get(layerName)
          ? selectedFeatures.get(layerName) : [];
        existingFeaturesByLayer.push(feature);
        // globthis._hilightFeatures.push(feature);
        selectedFeatures.set(layerName, existingFeaturesByLayer);
        console.log('selected layers ', selectedFeatures);
      }); */
      // here changing the feature map selectedFeatures to PrevSelectedFeatures
      console.log('what are selected features? ', selectedFeatures, PrevSelectedFeatures);
      if (PrevSelectedFeatures.size > 0) {
        const popupComp = options.popupComponent;
        this.overlay = popupComp.getGeoPopup();
        popupComp.setContent('multi-layer-info', PrevSelectedFeatures, options.isCovidPage);
        this.overlay.setPosition(e.mapBrowserEvent.coordinate);
        // this.basemap.getView().setCenter(e.mapBrowserEvent['coordinate']);
        this.basemap.addOverlay(this.overlay);
        // console.log('get overlays ', this.basemap.getOverlays(), this.basemap.getPixelFromCoordinate(e.mapBrowserEvent['coordinate']));
        this.basemap.getOverlays().forEach((overLay, index) => {
          console.log(overLay);
          if ((this.basemap.getOverlays().getLength() - 1) === index) {
            console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1), overLay.getMap());
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
    });
  }
  public tempClick(options): any {
    return;
  }
  // Click Event on Property tool
  public getFeatureInfoByPolygone(options): any {
    console.log('Get Property tool activated!', options);
    this.select = new Select();
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

  public destroy(): any {
    console.log('Property tool destroyed!', this.basemap.getLayers());
    this.basemap.removeInteraction(this.select);
    this.basemap.removeInteraction(this.dragBox);
    this.basemap.removeOverlay(this.overlay);
    unByKey(this.listener);
    this.basemap.getLayers().forEach(layer => {
      console.log('this is the auto polygon layer ', layer);
      if (layer !== undefined) {
        if (layer.values_.name === 'auto-polygon') {
          this.basemap.removeLayer(layer);
        }
      }
    });
  }

  private getLayerPropertiesInfo(options): any {
    /* this._select = new Select({
      condition: condition.click
    });
    this.basemap.addInteraction(this._select); */
    this.select.on('select', (e) => {
      if (e.mapBrowserEvent.originalEvent.shiftKey) {
        this.temp_selectClick(options);
        return this;
      }
    });
    this.processAutoDrawPolygone(options);
    return this;
  }

  private processAutoDrawPolygone(options): any {
    const pixcelAdjestmentVal = 8;
    this.listener = this.basemap.on('click', (evt) => {
      const coord = [evt.coordinate[1].toFixed(6), evt.coordinate[0].toFixed(6)];
      // console.log('Coordinates', coord);
      // console.log('Coord System', this.basemapProjection);
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
      // console.log('get coordinates from pixcel', changedCoords, changedCoordsLat, changedCoordsLng, changedCoordsLatLng,
      // ' new cods ', changesCoordsTopLeft, changesCoordsTopRight, changesCoordsDownLeft, changesCoordsDownRight,
      // changesCoordsTopMid, changesCoordsTopDown);
      /* const totalcorrds = [[changedCoords[1], changedCoords[0]],
      [changedCoordsLat[1], changedCoordsLat[0]], [changedCoordsLng[1], changedCoordsLng[0]],
      [changedCoordsLatLng[1], changedCoordsLatLng[0]], [changedCoords[1], changedCoords[0]]]; */
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
    this.processPopupData(options, evt, boxExtent);
  }
}

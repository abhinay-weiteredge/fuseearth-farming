import OlMap from 'ol/Map';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import Draw from 'ol/interaction/Draw';
import { platformModifierKeyOnly } from 'ol/events/condition.js';
import { Select } from 'ol/interaction.js';
import { Circle } from 'ol/geom';
import Feature from 'ol/Feature.js';
import { unByKey } from 'ol/Observable.js';

import Overlay from 'ol/Overlay.js';
import { LineString, Polygon } from 'ol/geom.js';
import { getArea, getLength, haversineDistance, getDistance } from 'ol/sphere';
import { Fill, Stroke, Style } from 'ol/style.js';
import {transform} from 'ol/proj';
import {getPointResolution} from 'ol/proj';

export class VicinityTool {
  private vectorLayer: VectorLayer;
  private vectorSource: VectorSource = new VectorSource();
  private dragCircle: any;
  private select: any;
  private overlay: any;
  private listener: any;
  // this hilightFeature for removing hilights and showing shilights of features..
  private hilightFeatures: any;

  // ---------------- new code for distance ------------
  private vectorLayerForDistance: VectorLayer;
  private vectorSourceForDistance: VectorSource = new VectorSource();
  private draw: any;
  private measureTooltip: any;
  private tooltipEl;
  private geometryChangeListener;
  private selectClick: any;
  private measureTooltipOverlayList = [];
  private basemapProjection;
  // ---------------- end ------------------------------

  constructor(private basemap: OlMap) { }

  private getVectorLayer(): any {
    if (!this.vectorLayer) {
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource
      });
    }
    this.vectorLayer.set('name', 'vicinity');
    return this.vectorLayer;
  }

  private getDrawCircle(): Draw {
    const drawing = new Draw({
      condition: platformModifierKeyOnly,
      source: this.vectorSource,
      type: 'Circle'
    });
    return drawing;
  }

  private onDrawCircleStart(): any {
    this.dragCircle.on('drawstart', (evt) => {
      this.hilightFeatures.clear();
      this.vectorSource.clear();
      const circle = evt.feature.getGeometry();
      let tooltipCoord = evt.coordinate;
      this.geometryChangeListener = circle.on('change', (evts) => {
        let circleDistance = getPointResolution(this.basemap.getView().getProjection(),
            evt.feature.getGeometry().getRadius(), evt.feature.getGeometry().getCenter(), 'm');
        const lengthUnit = localStorage.getItem('unit');
        if (lengthUnit === 'us') {
          circleDistance = Number(((circleDistance / 1000 * 100) / 100 ) / 1.609).toFixed(4) + ' ' + 'miles';
        } else if (lengthUnit === 'metric') {
          circleDistance = Number((circleDistance / 1000 * 100) / 100).toFixed(4) + ' ' + 'kms';
        } else if (lengthUnit === 'METRE') {
          circleDistance = Number(((circleDistance / 1000 * 100) / 100) * 1000).toFixed(4) + ' ' + 'metre';
        } else {
          circleDistance = Number(((circleDistance / 1000 * 100) / 100 ) / 1.609).toFixed(4) + ' ' + 'miles';
        }
        tooltipCoord = evts.target.getLastCoordinate();
        this.tooltipEl.style.position = 'relative';
        this.tooltipEl.innerHTML = circleDistance;
        this.measureTooltip.setPosition(tooltipCoord);
      });
    });
  }

  private getSelectedFeatures(circle): any {
    const selectedFeatures = new Map();
    const basemapLayers = this.basemap.getLayers();
    console.log('after draw list of Layers: ', basemapLayers);
    // As already we have basemap as layer we should get additional layers hence using length > 1.
    basemapLayers.forEach((layer, index) => {
      console.log('layer.name: ', layer.values_.name, layer.ol_uid);
      /* layer.name working - here avoiding basemap & current vector vicinitymap
       * cause this vicinity have circle feature */
      // if (index !== 0 && layer.values_.name !== 'vicinity') {
      if (index !== 0 && layer.values_.name !== 'vicinity' && layer.type !== 'TILE'
            && layer.type !== 'IMAGE' && layer.values_.type !== 'IMAGE'  && layer.values_.type !== 'URL'
            && layer.values_.name !== 'openstreet' && layer.values_.name !== 'toner'
            && layer.values_.name !== 'satellite' && layer.values_.name !== 'terrain'
            && layer.values_.name !== 'bingsatellite' && layer.values_.name !== 'bingstreet'
            && layer.values_.name !== 'googlestreet' && layer.values_.name !== 'googlesatellite') {
        console.log('inside ', layer.getSource(), layer.values_.name, circle.getRadius(),
        circle.getExtent(), circle.getFirstCoordinate(), circle.getLastCoordinate());
        layer.getSource().forEachFeatureIntersectingExtent(circle.getExtent(), (feature) => {
          // if layer.name doesn't exist you should use layer.id
          if (circle.intersectsExtent(feature.getGeometry().getExtent())) {
            const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
              ? selectedFeatures.get(layer.values_.name) : [];
            existingFeaturesByLayer.push(feature);
            this.hilightFeatures.push(feature);
            selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
          }
        });
      }
    });
    return selectedFeatures;
  }

  private onDrawCircleEnd(options): any {
    this.dragCircle.on('drawend', (evt) => {
      const circle = evt.feature.getGeometry();
      const selectedFeatures = this.getSelectedFeatures(circle);
      console.log('multilayer data ', selectedFeatures);
      // this._popupOperations(options, 'multi-layer-info', selectedFeatures, _circle.getCenter());
      this.tooltipEl.style.position = 'relative';
      this.tooltipEl.className = 'tooltipGTB tooltip-staticGTB';
      this.measureTooltip.setOffset([0, -7]);
      evt.sketch = null;
      // unset tooltip so that a new one can be created
      // this.tooltipEl = null;
      // this.createMeasureTooltip(false);
      // unByKey(this.geometryChangeListener);
    });
  }
  /** this method used for open popup and add to map */
  private popupOperations(options, contentType, content, coordinates): any {
    const popupComp = options.popupComponent;
    this.overlay = popupComp.getGeoPopup();
    popupComp.setContent(contentType, content);
    this.overlay.setPosition(coordinates);
    this.basemap.addOverlay(this.overlay);
    this.basemap.getOverlays().forEach((overLay, index) => {
      console.log(overLay);
      if ((this.basemap.getOverlays().getLength() - 1) === index) {
        console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1), overLay.getMap());
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
  // Ctrl + Click on Vicinity tool
  public getFeatureInfoByCircle(options): any {
    console.log('Get Ctrl Vicinity tool activated!');
    this.basemap.addLayer(this.getVectorLayer());
    this.select = new Select();
    this.basemap.addInteraction(this.select);
    this.dragCircle = this.getDrawCircle();
    this.basemap.addInteraction(this.dragCircle);
    this.hilightFeatures = this.select.getFeatures();
    this.createMeasureTooltip();
    // this.temp_selectClick(options);
    this.onDrawCircleStart();
    this.onDrawCircleEnd(options);
    return this;
  }
  private temp_selectClick(options): any {
    const globthis = this;
    this.select.on('select', (e) => {
      console.log(e.target);
      const selectedFeatures = new Map();
      const me = this;
      const features = [];
      const basemapLayers = this.basemap.getLayers();
      // As already we have basemap as layer we should get additional layers hence using length > 1.
      basemapLayers.forEach((layer, index) => {
        console.log('layer.name: ', layer.values_.name, layer.ol_uid);
        /** layer.name working - here avoiding basemap  */
        if (index !== 0) {
          e.target.getFeatures().forEach((feature) => {
            const existingFeaturesByLayer = selectedFeatures.get(layer.values_.name)
              ? selectedFeatures.get(layer.values_.name) : [];
            existingFeaturesByLayer.push(feature);
            // globthis._hilightFeatures.push(feature);
            selectedFeatures.set(layer.values_.name, existingFeaturesByLayer);
          });
        }
      });
      console.log('what are selected features? ', selectedFeatures);
      if (selectedFeatures.size > 0) {
        const popupComp = options.popupComponent;
        this.overlay = popupComp.getGeoPopup();
        popupComp.setContent('multi-layer-info', selectedFeatures, false);
        this.overlay.setPosition(e.mapBrowserEvent.coordinate);
        this.basemap.addOverlay(this.overlay);
        this.basemap.getOverlays().forEach((overLay, index) => {
          if ((this.basemap.getOverlays().getLength() - 1) === index) {
            console.log('what is overlay rendered top ', parseInt(overLay.rendered.top_, 1), overLay.getMap());
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
    });
  }
  // Click Event on Vicinity tool
  public getFeatureInfoByCircleRadius(options): any {
    console.log('Get Vicinity tool activated!');
    this.basemap.addLayer(this.getVectorLayer());
    /* this._select = new Select();
    this.basemap.addInteraction(this._select);
    this._hilightFeatures = this._select.getFeatures(); */
    this.onMapClick(options);
    return this;
  }
  private onMapClick(options): any {
    this.listener = this.basemap.on('click', (evt) => {
      this.basemap.removeInteraction(this.select);
      const interactionArray = [];
      this.basemap.getInteractions().forEach((interaction) => {
        if (interaction instanceof Select) {
          interactionArray.push(interaction);
        }
      });
      interactionArray.forEach((interation) => {
        console.log('array inside ', interation);
        this.basemap.removeInteraction(interation);
      });
      const returnPopupComp = this.popupOperations(options, 'radius-content-info', '', evt.coordinate);
      returnPopupComp.onRadiusChange.subscribe(readiusValue => {
        returnPopupComp.close();
        // after getting value draw a circle on map
        const selectedFeatures = this.drawCircleByRadiusInput(readiusValue, evt);
        // this._popupOperations(options, 'multi-layer-info', selectedFeatures, evt.coordinate);
      });
    });
  }
  private drawCircleByRadiusInput(radiusValue, evt): any {
    console.log(radiusValue);
    if (this.hilightFeatures) {
      this.hilightFeatures.clear();
    }
    if (this.vectorSource.getFeatures().length > 0) {
      this.vectorSource.clear();
    }
    const units = localStorage.getItem('unit');
    let circleObj;
    if (units === 'us') {
      circleObj = new Circle(evt.coordinate, radiusValue * 1.609 / 100);
    } else if (units === 'metric') {
      circleObj = new Circle(evt.coordinate, radiusValue / 100);
    }
    this.select = new Select();
    this.basemap.addInteraction(this.select);
    this.hilightFeatures = this.select.getFeatures();
    const circleFeature = new Feature(circleObj);
    this.vectorSource.addFeature(circleFeature);
    const circle = circleFeature.getGeometry();
    console.log('_circle ', circle, circleFeature);
    const selectedFeatures = this.getSelectedFeatures(circle);
    console.log('multilayer data radius Vicinity ', selectedFeatures);
    return selectedFeatures;
  }

  // -------------------------- New code for vicinity distance shoing drwing circle ----------
  private createMeasureTooltip(): any {
    if (this.tooltipEl) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.style.position = 'relative';
    this.tooltipEl.className = 'tooltipGTB tooltip-measureGTB';
    this.measureTooltip = new Overlay({
      element: this.tooltipEl,
      offset: [0, -15],
      positioning: 'bottom-center'
    });
    this.basemap.addOverlay(this.measureTooltip);
    this.measureTooltipOverlayList.push(this.measureTooltip);
  }
  // -------------------------- end this -----------------------------------------------------
  // Deactivated Called this method
  public destroy(): any {
    console.log('Vicinity tool destroyed!');
    this.basemap.removeLayer(this.vectorLayer);
    this.basemap.removeInteraction(this.dragCircle);
    this.basemap.removeInteraction(this.select);
    unByKey(this.listener);
    this.basemap.removeOverlay(this.overlay);
    unByKey(this.geometryChangeListener);
    this.removeOverLaysMeasurments();
    this.basemap.removeLayer(this.vectorLayerForDistance);
    this.basemap.removeInteraction(this.draw);
  }
  // this function will remove only added overlays not others...
  private removeOverLaysMeasurments(): any {
    this.measureTooltipOverlayList.forEach((overLay) => {
      this.basemap.removeOverlay(overLay);
    });
  }
}

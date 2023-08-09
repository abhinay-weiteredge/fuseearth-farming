import OlMap from 'ol/Map';
import { LineString, Polygon } from 'ol/geom.js';
import { unByKey } from 'ol/Observable.js';
import Overlay from 'ol/Overlay.js';
import { getArea, getLength, haversineDistance, getDistance } from 'ol/sphere';
import Draw from 'ol/interaction/Draw';
import { Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Select } from 'ol/interaction';
import * as condition from 'ol/events/condition';
import {transform} from 'ol/proj';
import Sphere from 'ol/sphere.js';

export class GeometryTool {
  private _draw: any;
  private _measureTooltip: any;
  private _tooltipEl;
  private _vectorLayer: VectorLayer;
  private _vectorSource: VectorSource = new VectorSource();
  private _geometryChangeListener;
  private _selectClick: any;
  private _overlay: any;
  private _measureTooltipOverlayList = [];
  private _basemapProjection;

  constructor(private basemap: OlMap) {
    this._basemapProjection = this.basemap.getView().getProjection().code_;
  }

  private _getVectorLayer() {
    if (!this._vectorLayer) {
      this._vectorLayer = new VectorLayer({
        source: this._vectorSource,
        // Style for drawing yellow line while measuring.
        style: new Style({
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2
          })
        }),
        name: 'gtb-vector-layer'
      });
    }
    return this._vectorLayer;
  }

  private _formatLength(line) {
    // console.log('am calling multiple time??', line.getCoordinates().length);
    let length = getLength(line);
    let output;
    const length_unit = localStorage.getItem('unit');
    /*  its temp commented code if any projection presentation
    const coordinates = line.getCoordinates();
    const sourceProj = this.basemap.getView().getProjection();
    const c1 = transform(coordinates[0], sourceProj, 'EPSG:4326');
    const c2 = transform(coordinates[1], sourceProj, 'EPSG:4326');
    const distance = getDistance(c1, c2); */
    let distance = 0;
    for (let i = 0; i < line.getCoordinates().length; i++) {
      if ((i + 1) !== line.getCoordinates().length) {
        const c1 = transform(line.getCoordinates()[i], this.basemap.getView().getProjection().getCode(), 'EPSG:4326');
        const c2 = transform(line.getCoordinates()[i + 1], this.basemap.getView().getProjection().getCode(), 'EPSG:4326');
        distance = distance + getDistance(c1, c2);
      }
    }
    // distance = distance + getDistance(line.getCoordinates()[0], line.getCoordinates()[1]);
    // this commented length working fine previously..
    // length = length * 106955.0323336333; // 106969.0323336333; // length * 1000 * 100;
    console.log('what is this tempLength ', distance, length);
    length = distance;
    let conversionDistance;
    if (length_unit === 'us') {
      output = Number(((length / 1000 * 100) / 100 ) / 1.609).toFixed(4) + ' ' + 'miles';
      conversionDistance = Number(((length / 1000 * 100) / 100 ) / 1.609).toFixed(4);
      if (conversionDistance < 1) {
        output = (conversionDistance * 5280).toFixed(4) + ' ' + 'ft';
      }
    } else if (length_unit === 'metric') {
      output = Number((length / 1000 * 100) / 100).toFixed(4) + ' ' + 'kms';
      conversionDistance = Number((length / 1000 * 100) / 100).toFixed(4);
      if (conversionDistance < 1) {
        output = (conversionDistance * 1000).toFixed(4) + ' ' + 'm';
      }
    } else if (length_unit === 'METRE') {
      output = Number(((length / 1000 * 100) / 100) * 1000).toFixed(4) + ' ' + 'metre';
    } else {
      output = Number(((length / 1000 * 100) / 100 ) / 1.609).toFixed(4) + ' ' + 'miles';
      conversionDistance = Number(((length / 1000 * 100) / 100 ) / 1.609).toFixed(4);
      if (conversionDistance < 1) {
        output = (output * 5280).toFixed(4) + ' ' + 'ft';
      }
    }
    return output;
  }

  private _formatArea(polygon) {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output = (Math.round(area / 1000000 * 100) / 100) +
        ' ' + 'km<sup>2</sup>';
    } else {
      output = (Math.round(area * 100) / 100) +
        ' ' + 'm<sup>2</sup>';
    }
    return output;
  }

  private _getDraw(drawType: string): Draw {
    const drawing = new Draw({
      source: this._vectorSource,
      type: drawType,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          lineDash: [10, 10],
          width: 2
        })
      })
    });
    return drawing;
  }

  private _onDrawStart() {
    this._draw.on('drawstart', (evt) => {
      // set sketch
      const sketch = evt.feature;
      let tooltipCoord = evt.coordinate;
      this._geometryChangeListener = sketch.getGeometry().on('change', (evts) => {
        const geom = evts.target;
        let distance;
        if (geom instanceof Polygon) {
          distance = this._formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          distance = this._formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        this._tooltipEl.style.position = 'relative';
        this._tooltipEl.innerHTML = distance;
        this._measureTooltip.setPosition(tooltipCoord);
      });
    });
  }

  private _onDrawEnd() {
    this._draw.on('drawend', (evt) => {
      this._tooltipEl.style.position = 'relative';
      this._tooltipEl.className = 'tooltipGTB tooltip-staticGTB';
      this._measureTooltip.setOffset([0, -7]);
      // unset sketch
      evt.sketch = null;
      // unset tooltip so that a new one can be created
      this._tooltipEl = null;
      this._createMeasureTooltip();
      unByKey(this._geometryChangeListener);
    });
  }

  private _createMeasureTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.parentNode.removeChild(this._tooltipEl);
    }
    this._tooltipEl = document.createElement('div');
    this._tooltipEl.style.position = 'relative';
    this._tooltipEl.className = 'tooltipGTB tooltip-measureGTB';
    this._measureTooltip = new Overlay({
      element: this._tooltipEl,
      offset: [0, -15],
      positioning: 'bottom-center'
    });
    this.basemap.addOverlay(this._measureTooltip);
    this._measureTooltipOverlayList.push(this._measureTooltip);
  }

  // Click Event on Geomotry tool
  public drawLineCalculateLength(options) {
    this.basemap.addLayer(this._getVectorLayer());
    this._draw = this._getDraw('LineString');
    this.basemap.addInteraction(this._draw);
    this._createMeasureTooltip();
    this._onDrawStart();
    this._onDrawEnd();
    return this;
  }

  // Ctrl + Click on Geometry tool
  public getLayerPropertiesInfo(options) {
    console.log('ctrl click Geometry');
    this._selectClick = new Select({
      condition: condition.click
    });
    this.basemap.addInteraction(this._selectClick);
    this._mapSelectClickEvent(options);
    return this;
  }

  private _mapSelectClickEvent(options) {
    const propertiesMap = new Map();
    this._selectClick.on('select', (evt) => {
      let area = 0;
      const bounds = [];
      let length = 0;
      if (evt.target.getFeatures().getLength() > 0 ) {
        evt.target.getFeatures().forEach((feature) => {
          console.log(feature.getGeometry().getType());
          if (feature.getGeometry().getType() === 'Polygon') {
            area = feature.getGeometry().getArea() * 1000 * 1000;
          } else if (feature.getGeometry().getType() === 'LineString') {
            length = feature.getGeometry().getLength() * 100;
          }
          console.log(' geometry - Bounds ', feature.getGeometry().getExtent(), area, length);
          feature.getGeometry().getExtent().forEach(bound => {
            bounds.push(bound.toFixed(2));
          });
        });
        propertiesMap.set('Area', area.toFixed(2) + ' - Units');
        propertiesMap.set('BBox', bounds);
        propertiesMap.set('Length', length.toFixed(2));
        propertiesMap.set('Perimeter', '');
        propertiesMap.set('Coord System', this._basemapProjection);
        const coordinates = evt.mapBrowserEvent.coordinate;
        this._popupOperations(options, 'layer-feature-info', propertiesMap, coordinates);
      }
    });
  }

  /** this method used for open popup and add to map */
  private _popupOperations(options, contentType, content, coordinates) {
    const popupComp = options.popupComponent;
    this._overlay = popupComp.getGeoPopup();
    popupComp.setContent(contentType, content);
    this._overlay.setPosition(coordinates);
    // this.basemap.getView().setCenter(coordinates);
    this.basemap.addOverlay(this._overlay);
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

  public destroy() {
    console.log('Destroying Geometry tool');
    this.basemap.removeLayer(this._vectorLayer);
    this.basemap.removeInteraction(this._draw);
    this.basemap.removeInteraction(this._selectClick);
    unByKey(this._geometryChangeListener);
    this._removeOverLaysMeasurments();
    this.basemap.removeOverlay(this._overlay);
  }

  // this function will remove only added overlays not others...
  private _removeOverLaysMeasurments() {
    this._measureTooltipOverlayList.forEach((overLay) => {
      this.basemap.removeOverlay(overLay);
    });
  }
}

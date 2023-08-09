import { IBasemap } from './IBasemap';
import OlTileLayer from 'ol/layer/Tile';
import OlXYZ from 'ol/source/XYZ';

export class SatelliteMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
    const source = new OlXYZ({
      /* attributions: ['Powered by Esri',
                     'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, ',
                     'USDA, USGS, AeroGRID, IGN, and the GIS User Community'],
      attributionsCollapsible: false, */
      // url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      // url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
      // url: 'https://sat0{1-4}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}',
      /* url: 'https://api.mapbox.com/v4/mapbox.satellite/1/0/0@2x.jpg90?'
      + 'access_token=pk.eyJ1IjoiZ2VvbW9jdXMiLCJhIjoiY2thbm5xaXoxMW8wcDJ4cGVseHhlaWRkbiJ9.GV_1M31DhMjYlFc93unvEg',
       */
      url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/{z}/{x}/{y}?' +
      'access_token=pk.eyJ1IjoiZ2VvbW9jdXMiLCJhIjoiY2thbm5xaXoxMW8wcDJ4cGVseHhlaWRkbiJ9.GV_1M31DhMjYlFc93unvEg',
       maxZoom: 23,
       crossOrigin: 'anonymous',
    });
    return new OlTileLayer({
      source: source,
      name: 'satellite',
      visible: false
    });
  }
}

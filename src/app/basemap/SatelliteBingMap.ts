import { IBasemap } from './IBasemap';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlTileWMS from 'ol/source/TileWMS';
import osm from 'ol/source/OSM';
import BingMaps from 'ol/source/BingMaps';


export class SatelliteBingMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
    // Here tried sentinel base map for testing.
      /* return new OlTileLayer({
        source: new OlTileWMS({
          url: "https://services.sentinel-hub.com/ogc/wms/01005ce7-587b-428f-ab1b-c028fd58b44d",
          params: {"urlProcessingApi":"https://services.sentinel-hub.com/ogc/wms/aeafc74a-c894-440b-a85b-964c7b26e471","maxcc":0,"minZoom":6,"maxZoom":16,"preset":"NDVI","layers":"NDVI","time":"2020-07-01/2021-01-18"},
          serverType: 'geoserver',
          transition: 0
        })
      }); */
      return new OlTileLayer({
        visible: false,
        preload: Infinity,
        source: new BingMaps({
          key: 'AsyUGselC-sTUDjUXG2zzNivnjN7bOBiYWL51gaoZUlyhlLUZ7tPcivlA_0lauMR',
          imagerySet: 'AerialWithLabelsOnDemand',
          // use maxZoom 19 to see stretched tiles instead of the BingMaps
          // "no photos at this zoom level" tiles
          // maxZoom: 19
          crossOrigin: 'anonymous',
        }),
        name: 'bingsatellite',
      });
  }
}


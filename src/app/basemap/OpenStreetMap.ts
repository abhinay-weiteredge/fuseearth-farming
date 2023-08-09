import { IBasemap } from './IBasemap';
import OlTileLayer from 'ol/layer/Tile';
import OlXYZ from 'ol/source/XYZ';

export class OpenStreetMap implements IBasemap {
  getMapTileLayer(): OlTileLayer {
    const source = new OlXYZ({
      url: 'https://tile.osm.org/{z}/{x}/{y}.png',
      crossOrigin: 'anonymous',
    });
    return new OlTileLayer({
      source: source,
      name: 'openstreet',
      visible: false
    });
  }
}

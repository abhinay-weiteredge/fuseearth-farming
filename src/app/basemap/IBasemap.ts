import OlTileLayer from 'ol/layer/Tile';

export interface IBasemap {
  getMapTileLayer(): OlTileLayer;
}

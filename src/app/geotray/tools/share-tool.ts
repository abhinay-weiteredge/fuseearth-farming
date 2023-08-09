import OlMap from 'ol/Map';

export class ShareTool {

  constructor(private basemap: OlMap) {
  }

  public getShare() {
    console.log('Get Share tool activated!');
    return this;
  }

  public destroy() {
    console.log('Share tool destroyed!');
  }
}

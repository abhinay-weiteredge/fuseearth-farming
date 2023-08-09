import OlMap from 'ol/Map';

export class RemarkTool {

  constructor(private basemap: OlMap) {
  }

  public getEditor() {
    console.log('Get Remark tool activated!');
    return this;
  }

  public destroy() {
    console.log('Remark tool destroyed!');
  }
}

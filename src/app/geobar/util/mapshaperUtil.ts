import { FileUtil } from './fileUtil';
import { UploadEvent } from '../events/upload-event';
import { BasemapService } from 'src/app/basemap/basemap.service';
import { AngularFireStorage } from '@angular/fire/storage/storage';

export class MapshaperUtil {
  private SHP_EXTENSION_CONSTANT: string = '.shp';
  private DBF_EXTENSION_CONSTANT: string = '.dbf';
  private PRJ_EXTENSION_CONSTANT: string = '.prj';
  private OUTPUT_GEOJSON_CONSTANT: string = 'output.geojson';
  firestorage: AngularFireStorage;
  public mapshaperUtilCallback: (featureCollections, files) => any;
  fileUtil;

  constructor() {
    this.fileUtil = new FileUtil(new BasemapService(), this.firestorage);
  }

  async getFeatureCollection(files, uploadEvent: UploadEvent) {
    const mapShpCmds = [];
    const cmdParams = await this._prepareCommandParams(files);
    console.log(cmdParams);
    uploadEvent.setUploadStatusInPercentage(30);
    let projStr = '';
    Object.keys(cmdParams).forEach(cmdParam => {
      const params = {};
      params[cmdParam] = cmdParams[cmdParam];
      if (cmdParam === 'input.prj') {
        projStr = cmdParams[cmdParam];
      }
      // * is the split of EPSG and projstr in mapshaper.js
      const cmd = ` -i ${cmdParam} -proj +init=EPSG:4326*${projStr} -o format=geojson output.geojson`;
      mapShpCmds.push(this._mapshpApplyCmdAsPromise(mapshaper, cmd, params));
    });
    uploadEvent.setUploadStatusInPercentage(40);
    let geometryCollection, featureCollection;
    console.log(mapShpCmds);
    mapShpCmds[1]
      .then((result) => {
        uploadEvent.setUploadStatusInPercentage(50);
        return this.fileUtil.pBufferReaderAsText(result[this.OUTPUT_GEOJSON_CONSTANT]);
      })
      .then((jsonText: string) => {
        geometryCollection = JSON.parse(jsonText);
        uploadEvent.setUploadStatusInPercentage(60);
        return mapShpCmds[2];
      })
      .then((result) => {
        uploadEvent.setUploadStatusInPercentage(70);
        return this.fileUtil.pBufferReaderAsText(result[this.OUTPUT_GEOJSON_CONSTANT]);
      })
      .then((jsonText: string) => {
        featureCollection = JSON.parse(jsonText);
        featureCollection.features.forEach((feature, idx) => {
          feature.geometry = geometryCollection.geometries[idx];
        });
        uploadEvent.setUploadStatusInPercentage(80);
        this.mapshaperUtilCallback(featureCollection, cmdParams);
        return featureCollection;
      });
  }

  private async _prepareCommandParams(files) {
    const cmdParams = {};
    await Promise.all([
      this.fileUtil.pFileReaderAsText(this.fileUtil.getFile(files, this.PRJ_EXTENSION_CONSTANT)),
      this.fileUtil.pFileReaderAsArrayBuffer(this.fileUtil.getFile(files, this.SHP_EXTENSION_CONSTANT)),
      this.fileUtil.pFileReaderAsArrayBuffer(this.fileUtil.getFile(files, this.DBF_EXTENSION_CONSTANT))])
      .then((values) => {
        cmdParams['input.prj'] = values[0];
        cmdParams['input.shp'] = values[1];
        cmdParams['input.dbf'] = values[2];
      });
    return cmdParams;
  }

  private _mapshpApplyCmdAsPromise(mapshaper, cmd, cmdParams) {
    return new Promise(function (resolve, reject) {
      // mapshaper.applyCommands(cmd, cmdParams, (err, output) => {
      mapshaper.runCommands(cmd, cmdParams, (err, output) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
  }
}

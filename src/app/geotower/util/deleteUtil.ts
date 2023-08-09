import * as moment from 'moment';
import { GeotowerService } from '../geotower.service';
import { ConfigServices } from 'src/app/config.service';
import { ConfigDataKeys } from 'src/app/config.enum';
import { Router } from '@angular/router';


export class DeleteUtil {
  private _authentication: any;
  deleteURL_temp = 'http://localhost:8282/geoserver/rest/layers/';
  deleteURL_temp_sql = 'http://localhost:7001/api/layers/';

  constructor(private geotowerService: GeotowerService,
    private configService: ConfigServices) {
    this._settingConfigData();
  }

  private _settingConfigData() {
    this._authentication = this.configService.configData[ConfigDataKeys.authorization];
  }

  deleteLayer(options) {
    const layerData = options.layerObj;
    console.log('Deleting the Layer and layerData ', layerData);
    const url = this.deleteURL_temp + layerData.wsname + ':' + layerData.name;
    this.geotowerService.deleteLayerFromGeoServer(url, this._authentication)
      .subscribe(response => {
        console.log('what is the response Here? ', response);
        this.geotowerService.deleteLayerFromPostgresql(this.deleteURL_temp_sql + layerData.id)
          .subscribe(result => {
            console.log('what is response after postgres deletion ', result);
          });
      });
  }
}

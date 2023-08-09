import { NgProgress } from 'ngx-progressbar';
import { toStringHDMS } from 'ol/coordinate';
import { AuthObservableService } from '../../Services/authObservableService';

export class SearchLocationEvent {

  constructor(private ngProgress: NgProgress, private authObsr: AuthObservableService) { }

  private isEmptyValueInString(splitedSpaceStr): any {
    return splitedSpaceStr.match(/(\s)/) ? true : false;
  }
  private strSplitByComma(str): any {
    return str.split(',');
  }
  private strSplitBySpace(str): any {
    return str.split(' ');  
  }
  private remveEWNS_CharFromStr(dmsStrEWNS): any {
    dmsStrEWNS = dmsStrEWNS.replace('E', '').trim();
    dmsStrEWNS = dmsStrEWNS.replace('W', '').trim();
    dmsStrEWNS = dmsStrEWNS.replace('N', '').trim();
    dmsStrEWNS = dmsStrEWNS.replace('S', '').trim();
    return dmsStrEWNS;
  }
  private removeDMS_SymboleFromStr(dmsStr): any {
    const degreeVal = dmsStr.split('°')[0].trim();
    dmsStr = dmsStr.replace(degreeVal + '°', '').trim();
    const minitesVal = dmsStr.split(/'/g)[0].trim();
    dmsStr = dmsStr.replace(minitesVal + "'", '').trim();
    const secondsVal = dmsStr.split(/"/g)[0].trim();
    console.log('total removed symboles ', degreeVal, minitesVal, secondsVal);
    return [degreeVal, minitesVal, secondsVal];
  }
  private dmsToDecimal(dmsStr): any {
    // parseFloat(latVal.split(' ')[0]) + parseFloat(latVal.split(' ')[1]) / 60 + parseFloat(latVal.split(' ')[2]) / 3600;
    let degree = 0;
    let minites = 0;
    let seconds = 0;
    if (dmsStr.length === 3) {
      degree = parseFloat(dmsStr[0]);
      minites = parseFloat(dmsStr[1]);
      seconds = parseFloat(dmsStr[2]);
      if(this.isLatLngPositiveOrNegative(degree)) {
        return degree + (minites / 60) + (seconds / 3600);
      } else {
        return degree - (minites / 60) - (seconds / 3600);
      }
    } else if (dmsStr.length === 2) {
      degree = parseFloat(dmsStr[0]);
      minites = parseFloat(dmsStr[1]);  
      if(this.isLatLngPositiveOrNegative(degree)) {
        return degree + (minites / 60);
      } else {
        return degree - (minites / 60);
      }
    } else {
      if(this.isLatLngPositiveOrNegative(degree)) {
        return degree + (minites / 60) + (seconds / 3600);
      } else {
        return degree - (minites / 60) - (seconds / 3600);
      }
    }
  }
  private isDMSCoordinates(coordinates): any {
    const strArray = this.strSplitBySpace(coordinates);
    if(strArray.length > 1) {
      return this.dmsToDecimal(this.strSplitBySpace(coordinates)).toFixed(6);
    } else {
      return coordinates
    }
  }
  public coordinatesSearchUtil(options): any {
    // this.ngProgress.start();
    // this.ngProgress.ref().start();
    let  latlngStr = options.inputValue; // .replace(/\s/g, '');
    // Common condition remove multiple spaces, tabs, newlines, etc with replace single space
    latlngStr = latlngStr.replace(/\s\s+/g, ' ');
    let latValue;
    let lngValue;
    // find comma separater
    if (this.strSplitByComma(latlngStr).length === 2) {
      console.log('trimming the 1st and last spaces ', this.strSplitByComma(latlngStr)[0].trim(),
      this.strSplitByComma(latlngStr)[1].trim());
      latValue = this.strSplitByComma(latlngStr)[0].trim();
      lngValue = this.strSplitByComma(latlngStr)[1].trim();

      if (options.isReverseLatlng) {
        const tmplat = latValue;
        const tmplng = lngValue;
        latValue = tmplng;
        lngValue = tmplat;
      }

      if (options.isDMS) {
        // it latlng string have symboles or EWNS
        if (latlngStr.match(/([°′″])/) && latlngStr.match(/([EWNS])/)) {
          console.log('its DMS with symbole && its DMS with EWNS');
          latValue = this.remveEWNS_CharFromStr(latValue);
          lngValue = this.remveEWNS_CharFromStr(lngValue);
          latValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(lngValue)).toFixed(6);
          console.log('its DMS with symbole && its DMS with EWNS in last', latValue, lngValue);

        } else if (latlngStr.match(/([°′″])/)) {
          console.log('its DMS with symbole');
          latValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(lngValue)).toFixed(6);
          console.log('its DMS with symbole in last', latValue, lngValue);

        } else if (latlngStr.match(/([EWNS])/)) {
          latValue = this.remveEWNS_CharFromStr(latValue);
          lngValue = this.remveEWNS_CharFromStr(lngValue);
          console.log('its DMS with EWNS', latValue, lngValue);
          console.log('its DMS with EWNS space split', this.strSplitBySpace(latValue), this.strSplitBySpace(lngValue));
          latValue = this.dmsToDecimal(this.strSplitBySpace(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.strSplitBySpace(lngValue)).toFixed(6);
          console.log('its DMS with EWNS in last', latValue, lngValue);
        } else {
          console.log('there no symboles & EWNS ', this.strSplitBySpace(latValue));
          latValue = this.dmsToDecimal(this.strSplitBySpace(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.strSplitBySpace(lngValue)).toFixed(6);
          console.log('there no symboles & EWNS in last', latValue, lngValue);
        }
      } else {
        // finding latlng string have without EWNS & without symboles as DMS
        latValue = this.isDMSCoordinates(latValue);
        lngValue = this.isDMSCoordinates(lngValue);
        // this.isDMSCoordinates(lngValue);
        // latValue = this.dmsToDecimal(this.strSplitBySpace(latValue)).toFixed(6);
        // lngValue = this.dmsToDecimal(this.strSplitBySpace(lngValue)).toFixed(6);
        console.log('there no symboles & EWNS in last', latValue, lngValue);

      }
    } else {
      // no comma found
      if (options.isDMS) {        
        if(this.strSplitBySpace(latlngStr).length === 2) {
          const latlngArray = this.strSplitBySpace(latlngStr);
          console.log(latlngArray,"check string.....")
          latValue = latlngArray[0];
          lngValue = latlngArray[1];
        } else {
          this.authObsr.updateErrors('Invalid Coordinates, Please enter valid lat, longs values.');
          this.ngProgress.ref().complete();
          return;          
        }
        if (latlngStr.match(/([°′″])/) && latlngStr.match(/([EWNS])/)) {
          console.log('its DMS with symbole && its DMS with EWNS - no camma ', latValue, lngValue);
          latValue = this.remveEWNS_CharFromStr(latValue);
          lngValue = this.remveEWNS_CharFromStr(lngValue);
          latValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(lngValue)).toFixed(6);
          console.log('its DMS with symbole && its DMS with EWNS in last - no camma ', latValue, lngValue);

        } else if (latlngStr.match(/([°′″])/)) {
          console.log('its DMS with symbole - no camma ');
          latValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.removeDMS_SymboleFromStr(lngValue)).toFixed(6);
          console.log('its DMS with symbole in last - no camma ', latValue, lngValue);

        } else if (latlngStr.match(/([EWNS])/)) {
          latValue = this.remveEWNS_CharFromStr(latValue);
          lngValue = this.remveEWNS_CharFromStr(lngValue);
          console.log('its DMS with EWNS - no camma ', latValue, lngValue);
          console.log('its DMS with EWNS space split', this.strSplitBySpace(latValue), this.strSplitBySpace(lngValue));
          latValue = this.dmsToDecimal(this.strSplitBySpace(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.strSplitBySpace(lngValue)).toFixed(6);
          console.log('its DMS with EWNS in last - no camma ', latValue, lngValue);
        } else {
          console.log('there no symboles & EWNS - no camma ');
          latValue = this.dmsToDecimal(this.strSplitBySpace(latValue)).toFixed(6);
          lngValue = this.dmsToDecimal(this.strSplitBySpace(lngValue)).toFixed(6);
          console.log('there no symboles & EWNS in last - no camma ', latValue, lngValue);
        }
      } else {
        // Here we did not have any commas between latlng or lnglat
        console.log('in no comma latlngs ', latlngStr, latlngStr.trim());
        const latlngStrArray = this.strSplitBySpace(latlngStr.trim());
        console.log(latlngStrArray,'array length 2 or 6.....')
        latValue = latlngStrArray[0].trim();
        lngValue = latlngStrArray[1].trim();
        if(latlngStrArray.length === 2) {
          latValue = latlngStrArray[0].trim();
          lngValue = latlngStrArray[1].trim();
        } else if (latlngStrArray.length === 6) {

          /* latValue = latlngStrArray[0].trim();
          lngValue = latlngStrArray[3].trim(); */
          latValue = this.dmsToDecimal([latlngStrArray[0].trim(), latlngStrArray[1].trim(), latlngStrArray[2].trim()]).toString();
          lngValue = this.dmsToDecimal([latlngStrArray[3].trim(), latlngStrArray[4].trim(), latlngStrArray[5].trim()]).toString();
        } else {
          this.authObsr.updateErrors('Invalid Coordinates, Please enter valid lat, longs values.');
          this.ngProgress.ref().complete();
          return;
        }
        if (options.isReverseLatlng) {
          const tmplat = latValue;
          const tmplng = lngValue;
          latValue = tmplng;
          lngValue = tmplat;
        }        
        console.log('after space separation & space trim latlng are ', latValue, lngValue, latlngStrArray);
      }
    }



    // let latVal = latlngStr.split(',')[0];
    // let lngVal = latlngStr.split(',')[1];
    let latVal = latValue;
    let lngVal = lngValue;
    if (-90 <= latVal && latVal <= 90) {
      console.log('lat value isbetween -90 to 90');
    } else if ((-180<= latVal && latVal <= 180) && (-90<= lngVal && lngVal <= 90)) {
      console.log('lat value isbetween -180 to 180 && lng value is between -90 to 90');
      latVal = lngValue;
      lngVal = latValue;
    } else {
      console.log('lat value out of range');
      this.authObsr.updateErrors('Invalid Coordinates, Please check your Coordinate system.');
      this.ngProgress.ref().complete();
      return;
    }
    if (-180 <= lngVal && lngVal <= 180) {
      console.log('long value isbetween -180 to 180');
    } else {
      console.log('lng value out of range');
      this.authObsr.updateErrors('Invalid Coordinates, Please check your Coordinate system.');
      this.ngProgress.ref().complete();
      return;
    }
    console.log('what is the length of the lalng split , ', options.inputValue.split(','), options.inputValue.split(' '));
    console.log('here lat lng values ', latVal, 'lng value', lngVal);
    if (latVal.split(' ').length === 2) {
      latVal = parseFloat(latVal.split(' ')[0]) + parseFloat(latVal.split(' ')[1]) / 60;
      latVal = latVal.toFixed(6);
    } else if (latVal.split(' ').length === 3) {
      latVal = parseFloat(latVal.split(' ')[0]) + parseFloat(latVal.split(' ')[1]) / 60 + parseFloat(latVal.split(' ')[2]) / 3600;
      latVal = latVal.toFixed(6);
    }
    if (lngVal.split(' ').length === 2) {
      lngVal = parseFloat(lngVal.split(' ')[0]) + parseFloat(lngVal.split(' ')[1]) / 60;
      lngVal = lngVal.toFixed(6);
    } else if (lngVal.split(' ').length === 3) {
      lngVal = parseFloat(lngVal.split(' ')[0]) + parseFloat(lngVal.split(' ')[1]) / 60 + parseFloat(lngVal.split(' ')[2]) / 3600;
      lngVal = lngVal.toFixed(6);
    }
    console.log('after conversion the lat lng values are ', latVal, lngVal);
    options.geobar.geobarService.addMarker(latVal, lngVal);
    const latlngsList = this.latlngCombinations(latVal, lngVal);
    options.geobar.loadDropDownContent(latlngsList);
    options.geobar.getOnSearchCoordinates([latVal,lngVal])
    // this.ngProgress.done();
    this.ngProgress.ref().complete();
  }

  private isLatLngPositiveOrNegative(latLngValue): any {
    const resultValue = Math.sign(latLngValue);
    if (resultValue >= 0) {
      return true;
    } else if (resultValue >= -1 || resultValue >= -0) {
      return false;
    } else {
      return false;
    }
  }

  private _generateCoordinatesObj(latVal, lngVal, latDegrees, lngDegrees): any {
    const latlngObj = {
      lat: latVal,
      lng: lngVal,
      latDegree: '( ' + latDegrees + ' )',
      lngDegree: '( ' + lngDegrees + ' )'
    };
    return latlngObj;
  }

  /** New code for combinatations creations */
  private latlngCombinations(latVal, lngVal): any {
    const latlngCombinatations = [];
    latVal = this.changeNegativeToPositive(latVal);
    lngVal = this.changeNegativeToPositive(lngVal);
    // Combination-1 -- (lat,lng) & (lng,lat)
    // Combination-2 -- (-lat,lng) & (-lng,lat)
    // Combination-3 -- (lat,-lng) & (-lng,lat)
    // Combination-4 -- (-lat,-lng) & (-lng,-lat)

    if (latVal === lngVal) {
      this.getCombination(latVal, lngVal, latlngCombinatations, 'N', 'E');
      this.getCombination(latVal, '-' + lngVal, latlngCombinatations, 'N', 'W');
      this.getCombination('-' + latVal, lngVal, latlngCombinatations, 'S', 'E');
      this.getCombination('-' + latVal, '-' + lngVal, latlngCombinatations, 'S', 'W');
    } else {
      this.getCombination(latVal, lngVal, latlngCombinatations, 'N', 'E');
      this.getCombination(lngVal, latVal, latlngCombinatations, 'N', 'E');
      this.getCombination(latVal, '-' + lngVal, latlngCombinatations, 'N', 'W');
      // this.getCombination('-' + lngVal, latVal, latlngCombinatations, 'N', 'W');
      this.getCombination(lngVal, '-' + latVal, latlngCombinatations, 'N', 'W');
      this.getCombination('-' + latVal, lngVal, latlngCombinatations, 'S', 'E');
      // this.getCombination(lngVal, '-' + latVal, latlngCombinatations, 'S', 'E');
      this.getCombination('-' + lngVal, latVal, latlngCombinatations, 'S', 'E');
      this.getCombination('-' + latVal, '-' + lngVal, latlngCombinatations, 'S', 'W');
      this.getCombination('-' + lngVal, '-' + latVal, latlngCombinatations, 'S', 'W');
    }
    return latlngCombinatations;
  }

  private getCombination(latVal, lngVal, latlngCombinatations, direcOne, direTwo): any {
    if (this.latRangeCondition(latVal) && (this.lngRangeCondition(lngVal))) {
      latlngCombinatations.push(this._generateCoordinatesObj(latVal, lngVal, direcOne, direTwo));
    } else if (this.latRangeCondition(latVal) && this.lngNegativeRangeCondition(lngVal)) {
      latlngCombinatations.push(this._generateCoordinatesObj(latVal, lngVal, direcOne, direTwo));
    } else if (this.latNegativeRangeCondition(latVal) && this.lngRangeCondition(lngVal)) {
      latlngCombinatations.push(this._generateCoordinatesObj(latVal, lngVal, direcOne, direTwo));
    } else if (this.latNegativeRangeCondition(latVal) && this.lngNegativeRangeCondition(lngVal)) {
      latlngCombinatations.push(this._generateCoordinatesObj(latVal, lngVal, direcOne, direTwo));
    }
  }

  private latRangeCondition(latVal): any {
    if ((parseFloat('0') < parseFloat(latVal)) && (parseFloat(latVal) < parseFloat('90'))) {
      return true;
    }
    return false;
  }

  private lngRangeCondition(lngVal): any {
    if ((parseFloat('0') < parseFloat(lngVal)) && (parseFloat(lngVal) < parseFloat('180'))) {
      return true;
    }
    return false;
  }

  private latNegativeRangeCondition(lngVal): any {
    if ((parseFloat('-90') < parseFloat(lngVal)) && (parseFloat(lngVal) < parseFloat('0'))) {
      return true;
    }
    return false;
  }

  private lngNegativeRangeCondition(lngVal): any {
    if ((parseFloat('-180') < parseFloat(lngVal)) && (parseFloat(lngVal) < parseFloat('0'))) {
      return true;
    }
    return false;
  }

  private changeNegativeToPositive(value): any {
    return Math.abs(value);
  }
}

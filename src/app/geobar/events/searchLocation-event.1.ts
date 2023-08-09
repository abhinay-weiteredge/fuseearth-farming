import { NgProgress } from 'ngx-progressbar';
import { toStringHDMS } from 'ol/coordinate';
import { AuthObservableService } from '../../Services/authObservableService';

export class SearchLocationEventOLD {

  constructor(private ngProgress: NgProgress, private authObsr: AuthObservableService) { }

  public coordinatesSearchUtil(options): any {
    // this.ngProgress.start();
    this.ngProgress.ref().start();
    const latlngStr = options.inputValue; // .replace(/\s/g, '');
    let latVal = latlngStr.split(',')[0];
    let lngVal = latlngStr.split(',')[1];
    if (-90 <= latVal && latVal <= 90) {
      console.log('lat value isbetween -90 to 90');
      latVal = latVal.replace(/\s/g, '');
    }
    if (-180 <= lngVal && lngVal <= 180) {
      console.log('long value isbetween -180 to 180');
      lngVal = lngVal.replace(/\s/g, '');
    }
    console.log('what is the length of the lalng split , ', options.inputValue.split(','), options.inputValue.split(' '));
    console.log('here lat lng values ', latVal, 'lng value', lngVal, latVal.split(' ').length, lngVal.split(' ').length);
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

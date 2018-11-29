import { Injectable } from '@angular/core';

import * as math from 'mathjs';
import { StorageService } from '../../services/storage/storage.service';

@Injectable()
export class ScalingService {

  constructor(
    private storageService: StorageService
  ) {
  }

  public saveScalingOptions(scalingOptions: any) {
    this.storageService.saveData('scalingOptions', JSON.stringify(scalingOptions)).catch((e) => {
      console.warn(e);
    });
  }

  public getAllScalingOptions() {
    return new Promise((resolve, reject) => {
      this.storageService.getData('scalingOptions')
        .then((data) => {
          if (data != null) {
            let scalingOptions: ScaleParams[] = JSON.parse(data);

            // evaluate saved expressions
            scalingOptions.forEach((option) => {
              option['expression'] = math.eval(`f(v)=${option['expressionString']}`);
            });
            resolve(scalingOptions);
          } else {
            resolve([]);
          }
        });
    });
  }

  public getScalingOption(name: string): any {
    return new Promise((resolve, reject) => {
      this.storageService.getData('scalingOptions')
        .then((data) => {
          if (data != null) {
            let scaleInfo = JSON.parse(data).filter((option) => {
              return option.name === name
            })[0];
            scaleInfo['expression'] = math.eval(`f(v)=${scaleInfo['expressionString']}`);
            resolve(scaleInfo);
          } else {
            reject();
          }
        });
    });
  }

  public evaluateExpression(expressionString, units): any {
    return new Promise((resolve, reject) => {
      if (expressionString.includes("v")) {
        try {
          let expression = math.eval(`f(v)=${expressionString}`);
          expression(2); // note(andrew): test that we can actually use the expression here
          resolve(expression);
        }
        catch (err) {
          console.log(err);
          reject();
        }
      } else {
        reject();
      }
    });
  }

}

export interface ScaleParams {
  name: string,
  expressionString: string,
  unitDescriptor: string,
  expression: any
}
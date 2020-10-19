import { Address } from './Address';
import { Apparatus } from './Apparatus';
import { Description } from './Description';
import { FireDepartment } from './FireDepartment';
import { Weather } from './Weather';

export class Incident {
  address: Address;
  apparatus: Apparatus[];
  description: Description;
  fire_department: FireDepartment;
  weather?: Weather;
  version: string;
}

export class IncidentMap extends Map<string, Incident> {
  _sortedKeys: Array<string> = new Array<string>();

  get sortedKeys(): Array<string> {
    if (this._sortedKeys.length === 0) {
      this._sortedKeys = Array.from(this.keys());
      this._sortedKeys.sort();
    }
    return this._sortedKeys;
  }
}

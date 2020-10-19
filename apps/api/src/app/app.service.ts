import { Injectable } from '@nestjs/common';
import { isNullOrUndefined } from 'util';

import * as fs from 'fs';
import * as path from 'path';

import axios from 'axios';
import { stringify } from 'querystring';

import { environment } from '../environments/environment';
import { Incident, IncidentMap, Weather } from '@its-ftw/api-interfaces';

@Injectable()
export class AppService {
  keys: Array<string> = new Array<string>();
  incidents: IncidentMap = new IncidentMap();

  constructor() {
    this.keys.push('F01705150050');
    this.keys.push('F01705150090');
  }

  protected async loadIncident(key: string): Promise<Incident> {
    try {
      let incident = this.incidents.get(key);
      if (isNullOrUndefined(incident)) {
        const name = `${key}.json`;
        const fqn = path.join(__dirname, 'assets/', name);
        const data = fs.readFileSync(fqn);
        incident = JSON.parse(data.toString());
      }
      if (!isNullOrUndefined(incident)) {
        return Promise.resolve(incident);
      } else {
        return Promise.reject(`Incident (${key}) not found`);
      }
    } catch (err) {
      return Promise.reject(`Error loading incident (${key}): ${err.message}`);
    }
  }

  protected async getStation(incident: Incident): Promise<any> {
    try {
      if (isNullOrUndefined(incident)) {
        return Promise.reject('Unable to get station for undefined incident');
      } else {
        const q = stringify({
          lat: incident.address.latitude,
          lon: incident.address.longitude,
          limit: 1,
        });
        const resp = await axios.get(
          `${environment.weather.stations_url}?${q}`,
          {
            headers: {
              'x-api-key': environment.weather.api_key,
            },
          }
        );
        const stations = resp.data.data;
        if (
          isNullOrUndefined(stations) ||
          !Array.isArray(stations) ||
          stations.length !== 1
        ) {
          return Promise.reject(
            `Unable to find weather station for incident (${incident.description.incident_number}). Response: ${resp.data}`
          );
        } else {
          return Promise.resolve(stations[0]);
        }
      }
    } catch (err) {
      return Promise.reject(
        `Error finding weather station for incident (${incident.description.incident_number}): ${err.message}`
      );
    }
  }

  protected async getWeatherData(
    station: any,
    incident: Incident
  ): Promise<Weather> {
    try {
      if (isNullOrUndefined(incident)) {
        return Promise.reject('Unable to get weather for undefined incident');
      } else {
        const startDateTime = incident.description.event_opened.split('T');
        const endDateTime = incident.description.event_closed.split('T');
        const q = stringify({
          station: station.id,
          lat: incident.address.latitude,
          lon: incident.address.longitude,
          start: startDateTime[0],
          end: endDateTime[0],
          tz: incident.fire_department.timezone,
        });
        const resp = await axios.get(`${environment.weather.hourly_url}?${q}`, {
          headers: {
            'x-api-key': environment.weather.api_key,
          },
        });
        const weather = resp.data.data;
        if (isNullOrUndefined(weather)) {
          return Promise.reject(
            `Unable to find weather data for incident (${incident.description.incident_number}). Response: ${resp.data}`
          );
        } else {
          const hour = incident.description.hour_of_day;
          if (Array.isArray(weather) && hour < weather.length) {
            return Promise.resolve(weather[hour]);
          }
          return Promise.resolve(weather);
        }
      }
    } catch (err) {
      return Promise.reject(
        `Error finding weather data for incident (${incident.description.incident_number}): ${err.message}`
      );
    }
  }

  protected async enrichIncident(incident: Incident): Promise<Incident> {
    try {
      if (isNullOrUndefined(incident)) {
        return Promise.reject('Unable to enrich undefined incident');
      } else {
        const station = await this.getStation(incident);
        if (isNullOrUndefined(station)) {
          return Promise.reject(
            `Unable to enrich incident (${incident.description.incident_number}). Undefined station.`
          );
        } else {
          const weather = await this.getWeatherData(station, incident);
          if (isNullOrUndefined(weather)) {
            return Promise.reject(
              `Unable to enrich incident (${incident.description.incident_number}). Undefined weather data.`
            );
          } else {
            incident.weather = weather;
            return Promise.resolve(incident);
          }
        }
      }
    } catch (err) {
      return Promise.reject(
        `Error enriching incident (${incident.description.incident_number}): ${err.message}`
      );
    }
  }

  async getIncidentList(): Promise<Array<Incident>> {
    if (this.incidents.size < this.keys.length) {
      const promises = new Array<Promise<Incident>>();
      this.keys.forEach((key) => {
        promises.push(this.loadIncident(key));
      });
      const incidents = await Promise.all(promises);
      incidents.forEach((incident) => {
        this.incidents.set(incident.description.incident_number, incident);
      });
    }
    return Promise.resolve(Array.from(this.incidents.values()));
  }

  async getIncidentDetails(key: string): Promise<Incident> {
    const incident = await this.loadIncident(key);
    if (isNullOrUndefined(incident)) {
      return Promise.reject(`Incident (${key}) not found`);
    } else if (isNullOrUndefined(incident.weather)) {
      return this.enrichIncident(incident);
    }
    return Promise.resolve(incident);
  }
}

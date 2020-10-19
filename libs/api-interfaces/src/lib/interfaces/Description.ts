// import { ExtendedData } from './ExtendedData';

export interface Description {
  comments: string;
  day_of_week: string;
  event_closed: string;
  event_id: string;
  event_opened: string;
  // extended_data: Partial<ExtendedData>;
  first_unit_arrived: string;
  first_unit_dispatched: string;
  first_unit_enroute: string;
  hour_of_day: number;
  incident_number: string;
  loi_search_complete: string;
  subtype: string;
  type: string;
}

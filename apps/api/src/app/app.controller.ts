import { Incident } from '@its-ftw/api-interfaces';
import { Controller, Get, Param } from '@nestjs/common';

import { AppService } from './app.service';

@Controller('incidents')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getIncidentList(): Promise<Array<Incident>> {
    return this.appService.getIncidentList();
  }

  @Get(':key')
  async getIncidentDetails(@Param() params: any): Promise<Incident> {
    return this.appService.getIncidentDetails(params.key);
  }
}

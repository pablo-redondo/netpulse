import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ChecksModule } from '../checks/checks.module';
import { HistoryModule } from '../history/history.module';
import { ServicesModule } from '../services/services.module';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    ChecksModule,
    HistoryModule,
    ServicesModule,
  ],
  providers: [ScheduleService],
})
export class ScheduleModule {}

import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { HistoryModule } from '../history/history.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ServicesModule, HistoryModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenancyModule } from '../../lib';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';
import {
  fromExtractors,
  fromHeader,
  fromQuery,
  fromSubdomain,
} from '../../lib/extractors';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/test'),
    TenancyModule.forRoot({
      tenantExtractor: fromExtractors([
        fromHeader('X-TENANT-ID'),
        fromQuery('tenantId'),
        fromSubdomain(),
      ]),
      options: () => {
        return {};
      },
      uri: (tenantId: string) => `mongodb://localhost/test-tenant-${tenantId}`,
    }),
    CatsModule,
    DogsModule,
  ],
})
export class AppModule {}

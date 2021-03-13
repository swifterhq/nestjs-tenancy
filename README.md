<h1 align="center">nestjs-tenancy</h1>

<p align="center">
  A simple easy to use multitenancy module for NestJs and Mongoose
</p>

<p align="center">
<a href="https://www.npmjs.com/@nean/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/v/@nean/nestjs-tenancy.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/@nean/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/l/@nean/nestjs-tenancy.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/@nean/nestjs-tenancy" target="_blank"><img src="https://img.shields.io/npm/dm/@nean/nestjs-tenancy.svg" alt="NPM Downloads" /></a>
</p>
## Description

[Mongoose](http://mongoosejs.com/) multitenancy module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save @nean/nestjs-tenancy
```

## Basic usage

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { TenancyModule } from "@nean/nestjs-tenancy";
import { CatsModule } from "./cat.module.ts";
import { fromHeader } from "@nean/nestjs-tenancy/extractors";

@Module({
  imports: [
    TenancyModule.forRoot({
        tenantExtractor: fromHeader('X-TENANT-ID'),
        options: () => {},
        uri: (tenantId: string) => `mongodb://localhost/test-tenant-${tenantId}`,
    }),
    CatsModule,
  ],
})
export class AppModule {}
```

Create class that describes your schema

**cat.model.ts**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Cat extends Document {
    @Prop()
    name: string;

    @Prop()
    age: number;

    @Prop()
    breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

Inject Cat for `CatsModule`

**cat.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TenancyModule } from '@nean/nestjs-tenancy';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
    imports: [
        TenancyModule.forFeature([{ name: Cat.name, schema: CatSchema }])
    ],
    controllers: [CatsController],
    providers: [CatsService],
})
export class CatsModule { }
```

Get the cat model in a service

**cats.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectTenancyModel } from '@nean/nestjs-tenancy';
import { Model } from 'mongoose';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './schemas/cat.schema';

@Injectable()
export class CatsService {
    constructor(
        @InjectTenancyModel(Cat.name) private readonly catModel: Model<Cat>
    ) { }

    async create(createCatDto: CreateCatDto): Promise<Cat> {
        const createdCat = new this.catModel(createCatDto);
        return createdCat.save();
    }

    async findAll(): Promise<Cat[]> {
        return this.catModel.find().exec();
    }
}
```

Finally, use the service in a controller!

**cats.controller.ts**

```typescript

import { Body, Controller, Get, Post } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './schemas/cat.schema';

@Controller('cats')
export class CatsController {
    constructor(private readonly catsService: CatsService) { }

    @Post()
    async create(@Body() createCatDto: CreateCatDto) {
        return this.catsService.create(createCatDto);
    }

    @Get()
    async findAll(): Promise<Cat[]> {
        return this.catsService.findAll();
    }
}
```

## Adding custom validators for the tenant

Let's say you want to handle a validation check to see if your tenant is registered. You can do 
this by implementing the `TenancyValidator` interface and writing your own validation logic inside
the `validate` method. The library invokes this method internally.

### Note
Here we assume that `X-TENANT-ID` is passed in the request header so that its available for the validator.

**custom-tenant.validator.ts**

```typescript
import { TenancyValidator } from '@app/tenancy';
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITenantModel } from '../../core/models/tenant.model';

@Injectable()
export class CustomTenantValidator implements TenancyValidator {
    private _tenantId: string;

    // This`Tenant` model definition schema is mapped to the common database and
    // not into the tenant database.
    constructor(@InjectModel('Tenant') private tenantModel: Model<ITenantModel>) { }

    /**
     * Method to set the tenant id
     *
     * @param {string} tenantId
     * @returns
     * @memberof CustomTenantValidator
     */
    setTenantId(tenantId: string): TenancyValidator {
        this._tenantId = tenantId;
        return this; // Make sure to return the instance of the class back here.
    }

    /**
     * Your Custom Validation to verify if tenant exist in the common database
     *
     * Note: This method will be invoked by the library internally when
     * tenant id is present in the context.
     *
     * @returns {Promise<void>}
     * @memberof CustomTenantValidator
     */
    async validate(): Promise<void> {
        const exist = await this.tenantModel.exists({ name: this._tenantId });
        if (!exist) {
            throw new NotFoundException(`Tenant not found`);
        }
    }
}
```

Export the validator from your tenant module

**tenant.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantSchema } from '../core/schemas/tenant.schema';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { CustomTenantValidator } from './validators/custom-tenant.validator';

@Module({
  imports: [
    // Here the connection represents the common database
    MongooseModule.forFeature([{ name: 'Tenant', schema: TenantSchema }])
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    // Your custom validator
    CustomTenantValidator,
  ],
  exports: [
    TenantService,
    CustomTenantValidator,
  ]
})
export class TenantModule {}
```

Export the database configuration

**config.ts**

```
export default () => ({
    database: {
        uri: process.env.MONGO_URI
    }
});
```

Finally you will also need to modify the module configuration.

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { TenancyModule } from "@nean/nestjs-tenancy";
import { CatsModule } from "./cat.module.ts";
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config';
import { TenantModule } from './tenant/tenant.module';
import { CustomTenantValidator } from './tenant/validators/custom-tenant.validator';
import { fromHeader } from "@nean/nestjs-tenancy/extractors";

@Module({
  imports: [
    // Load the default configuration file
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
    }),
    // Mongoose default connection
    MongooseModule.forRootAsync({
      useFactory: async (cfs: ConfigService) => cfs.get('database'),
      inject: [ConfigService],
    }),
    // Tenant async configuration
    TenancyModule.forRootAsync({
      imports: [TenantModule],
      useFactory: async (cfs: ConfigService, tVal: CustomTenantValidator) => {
        return {
          // Base tenant configurations
          tenantExtractor: fromHeader('X-TENANT-ID'),
          options: () => {},
          uri: (tenantId: string) => `mongodb://localhost/test-tenant-${tenantId}`,
          // Custom validator to check if the tenant exist in common database
          validator: (tenantId: string) => tVal.setTenantId(tenantId),
        }
      },
      inject: [ConfigService, CustomTenantValidator],
    }),
    CatsModule,
  ],
})
export class AppModule {}
```

## Subdomain support

This library also enables the extraction of tenant id from the sudomain of the url.
For enabling this you need to modify your configuration like below.

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { TenancyModule } from "@nean/nestjs-tenancy";
import { CatsModule } from "./cat.module.ts";
import { fromSubdomain } from "@nean/nestjs-tenancy/extractors";

@Module({
  imports: [
    TenancyModule.forRoot({
        // This will allow the library to extract the subdomain as tenant id
        tenantExtractor: fromSubdomain(),
        options: () => {},
        uri: (tenantId: string) => `mongodb://localhost/test-tenant-${tenantId}`,
    }),
    CatsModule,
  ],
})
export class AppModule {}
```

## Support for Mongo Transactions

There are cases when using Mongo Transactions we wouldn't get the flexibility of
mongoose to automatically initialize the empty collection for us. In that case
we can make use of the property in `TenancyModuleOptions` which is `forceCreateCollections: true`
(set to false by default) to automatically initialize all collections that are mapped to `TenancyModule`.

## Requirements

1.  @nest/mongoose ^7.0.0
2.  @nestjs/common ^7.0.0
3.  @nestjs/core ^7.0.0
4.  mongoose ^5.11.0 (with mongoose official typeings)

## Test

```bash
# e2e tests
$ npm run test:e2e
```

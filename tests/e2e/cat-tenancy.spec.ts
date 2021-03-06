import { HttpStatus, INestApplication } from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Cat } from '../src/cats/schemas/cat.schema';

describe('CatTenancy', () => {
  let server: Server;
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  it(`should return created document`, (done) => {
    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    request(server)
      .post('/cats')
      .set('X-TENANT-ID', 'cats')
      .send(createDto)
      .expect(HttpStatus.CREATED)
      .end((err, { body }) => {
        expect(err).toBeNull();
        expect(body.name).toEqual(createDto.name);
        expect(body.age).toEqual(createDto.age);
        expect(body.breed).toEqual(createDto.breed);
        done();
      });
  });

  it(`should not return documents from other tenants`, (done) => {
    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    let item: Cat;
    request(server)
      .post('/cats')
      .set('X-TENANT-ID', 'cats')
      .send(createDto)
      .expect(HttpStatus.CREATED)
      .end((err, { body }) => {
        item = body as Cat;
        expect(err).toBeNull();
        expect(body._id).toBeDefined();
        expect(body.name).toEqual(createDto.name);
        expect(body.age).toEqual(createDto.age);
        expect(body.breed).toEqual(createDto.breed);
        done();
      });

    request(server)
      .get('/cats')
      .set(
        'X-TENANT-ID',
        `not_existant${Math.random().toString().replace('.', '_')}`,
      )
      .expect(HttpStatus.OK)
      .end((err, { body }) => {
        expect(err).toBeNull();
        expect(body).toEqual([]);
        done();
      });

    request(server)
      .get('/cats')
      .set('X-TENANT-ID', 'cats')
      .expect(HttpStatus.OK)
      .end((err, { body }) => {
        expect(err).toBeNull();
        expect(body).not.toEqual([]);
        done();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

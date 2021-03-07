import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('e2e subdomain extractor', () => {
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

  it(`should not error with correct host`, (done) => {
    const createDto = { name: 'Charlie', breed: 'Beagle', age: 6 };
    request(server)
      .post('/dogs')
      .set('Host', 'swifter.example.com')
      .send(createDto)
      .expect(201)
      .end((err, { body }) => {
        expect(err).toBeNull();
        expect(body.name).toEqual(createDto.name);
        expect(body.age).toEqual(createDto.age);
        expect(body.breed).toEqual(createDto.breed);
        done();
      });
  });

  it(`should error if tenant id is missing`, (done) => {
    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    request(server)
      .post('/cats')
      .send(createDto)
      .expect(HttpStatus.BAD_REQUEST)
      .end((err, { body }) => {
        expect(err).toBeNull();
        expect(body.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(body.error).toEqual('Bad Request');
        expect(body.message).toContain('tenant id not supplied');
        done();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

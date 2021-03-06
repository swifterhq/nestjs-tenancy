import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('QueryTenancy', () => {
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

  it(`should error if tenant id is missing`, (done) => {
    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    request(server)
      .post('/cats')
      .send(createDto)
      .expect(HttpStatus.BAD_REQUEST)
      .end((err, response) => {
        const { body } = response;
        expect(err).toBeNull();
        expect(body.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(body.error).toEqual('Bad Request');
        expect(body.message).toContain('is not supplied');
        done();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

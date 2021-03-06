import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectTenancyModel } from '../../../lib';
import { CreateDogDto } from './dto/create-dog.dto';
import { Dog, DogDocument } from './schemas/dog.schema';

@Injectable()
export class DogsService {
  constructor(
    @InjectTenancyModel(Dog.name) private readonly dogModel: Model<DogDocument>,
  ) {}

  async create(createDogDto: CreateDogDto): Promise<Dog> {
    const createdDog = new this.dogModel(createDogDto);
    return createdDog.save();
  }

  async findAll(): Promise<Dog[]> {
    return this.dogModel.find().exec();
  }
}

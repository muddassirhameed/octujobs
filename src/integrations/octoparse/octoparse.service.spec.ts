import { Test, TestingModule } from '@nestjs/testing';
import { OctoparseService } from './octoparse.service';

describe('OctoparseService', () => {
  let service: OctoparseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OctoparseService],
    }).compile();

    service = module.get<OctoparseService>(OctoparseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

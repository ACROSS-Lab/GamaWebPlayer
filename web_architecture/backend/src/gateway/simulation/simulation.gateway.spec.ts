import { Test, TestingModule } from '@nestjs/testing';
import { SimulationGateway } from './simulation.gateway';

describe('SimulationGateway', () => {
  let gateway: SimulationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulationGateway],
    }).compile();

    gateway = module.get<SimulationGateway>(SimulationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

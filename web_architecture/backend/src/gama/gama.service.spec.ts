import { Test, TestingModule } from '@nestjs/testing';
import { GamaService } from './gama.service';

describe('GamaService', () => {
    let service: GamaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GamaService],
        }).compile();

        service = module.get<GamaService>(GamaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Pick<Repository<Product>, 'find' | 'findOne' | 'save'>>;

  const product: Product = {
    id: 1,
    name: 'Choco Clássico',
    price: 3,
    stock: 10,
    active: true,
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  describe('findActive', () => {
    it('retorna somente produtos ativos ordenados por id', async () => {
      repository.find.mockResolvedValue([product]);

      await expect(service.findActive()).resolves.toEqual([product]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { id: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('lanca NotFoundException quando o produto nao existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('persiste o novo estoque do produto', async () => {
      repository.findOne.mockResolvedValue({ ...product });
      repository.save.mockImplementation((entity) => Promise.resolve(entity as Product));

      await expect(service.updateStock(1, 15)).resolves.toMatchObject({ id: 1, stock: 15 });
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ stock: 15 }));
    });

    it('aceita zerar o estoque', async () => {
      repository.findOne.mockResolvedValue({ ...product });
      repository.save.mockImplementation((entity) => Promise.resolve(entity as Product));

      await expect(service.updateStock(1, 0)).resolves.toMatchObject({ stock: 0 });
    });

    it('nao salva nada quando o produto nao existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStock(99, 5)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});

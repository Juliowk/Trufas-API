import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /** Catalogo publico: apenas produtos ativos, na ordem dos ids. */
  findActive(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { active: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Produto ${id} nao encontrado`);
    }

    return product;
  }

  async updateStock(id: number, stock: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock = stock;

    return this.productsRepository.save(product);
  }
}

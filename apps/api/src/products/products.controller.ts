import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  type ListProductsQuery,
  SORT_OPTIONS,
  listProductsQuerySchema,
  productIdSchema,
} from './products.schema.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@ApiSecurity('api-key')
@Controller({ version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  @ApiOperation({
    summary: 'Daftar produk dengan filter, sort, paginasi, dan facet',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'brands', required: false, description: 'Dipisah koma' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'sort', required: false, enum: SORT_OPTIONS })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(@Query({ schema: listProductsQuerySchema }) query: ListProductsQuery) {
    return this.products.list(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Detail produk termasuk ulasan' })
  findOne(@Param('id', { schema: productIdSchema }) id: number) {
    return this.products.findOne(id);
  }

  @Get('products/:id/related')
  @ApiOperation({ summary: 'Produk lain dari kategori yang sama' })
  related(@Param('id', { schema: productIdSchema }) id: number) {
    return this.products.related(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Daftar kategori beserta jumlah produk' })
  categories() {
    return this.products.categories();
  }
}

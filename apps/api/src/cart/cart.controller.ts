import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { type CartQuoteInput, cartQuoteSchema } from './cart.schema.js';
import { CartService } from './cart.service.js';

@ApiTags('cart')
@ApiSecurity('api-key')
@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post('quote')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Hitung total keranjang di server (harga, promo, ongkir)',
  })
  quote(@Body({ schema: cartQuoteSchema }) body: CartQuoteInput) {
    return this.cart.quote(body);
  }
}

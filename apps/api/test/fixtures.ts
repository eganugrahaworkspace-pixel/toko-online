const base = {
  description: 'Deskripsi produk',
  stock: 10,
  tags: ['demo'],
  reviews: [
    {
      rating: 5,
      comment: 'Mantap',
      date: '2025-04-30T09:41:02.053Z',
      reviewerName: 'Eleanor Collins',
      reviewerEmail: 'eleanor.collins@x.dummyjson.com',
    },
  ],
  shippingInformation: 'Ships in 3-5 business days',
};

export const upstreamProducts = {
  total: 3,
  skip: 0,
  limit: 0,
  products: [
    {
      ...base,
      id: 1,
      title: 'Essence Mascara Lash Princess',
      category: 'beauty',
      brand: 'Essence',
      price: 9.99,
      discountPercentage: 10.48,
      rating: 2.56,
      thumbnail: 'https://cdn.dummyjson.com/p/1/thumbnail.webp',
      images: ['https://cdn.dummyjson.com/p/1/1.webp'],
    },
    {
      ...base,
      id: 2,
      title: 'Knoll Saarinen Executive Conference Chair',
      category: 'furniture',
      brand: 'Knoll',
      price: 499.99,
      discountPercentage: 2.01,
      rating: 4.88,
      stock: 2,
      thumbnail: 'https://cdn.dummyjson.com/p/2/thumbnail.webp',
      images: [],
    },
    {
      ...base,
      id: 3,
      title: 'Kiwi',
      category: 'groceries',
      price: 2.49,
      discountPercentage: 0.5,
      rating: 4.93,
      thumbnail: 'https://cdn.dummyjson.com/p/3/thumbnail.webp',
      images: ['https://cdn.dummyjson.com/p/3/1.webp'],
    },
  ],
};

export const upstreamCategories = [
  {
    slug: 'beauty',
    name: 'Beauty',
    url: 'https://dummyjson.com/products/category/beauty',
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    url: 'https://dummyjson.com/products/category/furniture',
  },
  {
    slug: 'groceries',
    name: 'Groceries',
    url: 'https://dummyjson.com/products/category/groceries',
  },
  {
    slug: 'laptops',
    name: 'Laptops',
    url: 'https://dummyjson.com/products/category/laptops',
  },
];

export function mockUpstreamFetch() {
  return vi.fn(async (input: URL | string) => {
    const url = new URL(input.toString());
    const body =
      url.pathname === '/products/categories'
        ? upstreamCategories
        : upstreamProducts;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
}

import { createProduct, getProducts, updateProduct, deleteProduct } from '../../../src/controllers/admin/productsController.js';
import Product from '../../../src/models/Product.js';

jest.mock('../../../src/models/Product.js');

describe('Products Controller', () => {
  // Define reusable mock product data
  const mockProductData = {
    _id: '123',
    name: 'Test Product',
    save: jest.fn().mockResolvedValue(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getProducts returns product list', async () => {
    const mockProducts = [{ name: 'Necklace' }, { name: 'Ring' }];
    Product.find.mockResolvedValue(mockProducts);

    const req = {};
    const res = { json: jest.fn() };
    const next = jest.fn();

    await getProducts(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockProducts);
    expect(next).not.toHaveBeenCalled();
  });

  test('createProduct saves and returns product', async () => {
    const saveMock = jest.fn().mockResolvedValue();
    Product.mockImplementation(() => ({ save: saveMock }));

    const req = { body: { name: 'Bracelet' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await createProduct(req, res, next);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('updateProduct updates product', async () => {
    const saveMock = jest.fn().mockResolvedValue();
    const updatedMockProduct = { ...mockProductData, name: 'Updated Bracelet', save: saveMock };
    Product.findById.mockResolvedValue(updatedMockProduct);

    const req = { params: { id: '123' }, body: { name: 'Updated Bracelet' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await updateProduct(req, res, next);

    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updatedMockProduct);
    expect(next).not.toHaveBeenCalled();
  });

  test('deleteProduct deletes product', async () => {
    Product.findByIdAndDelete.mockResolvedValue(mockProductData);

    const req = { params: { id: '123' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await deleteProduct(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockProductData);
    expect(next).not.toHaveBeenCalled();
  });
});

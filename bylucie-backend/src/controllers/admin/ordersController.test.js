import { getOrders, updateOrderStatus } from '../../../src/controllers/admin/ordersController.js';
import Order from '../../../src/models/Order.js';

jest.mock('../../../src/models/Order.js');

describe('Orders Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getOrders returns orders', async () => {
    const orders = [{ status: 'Pending' }];
    Order.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(orders) });

    const req = {};
    const res = { json: jest.fn() };
    await getOrders(req, res);

    expect(res.json).toHaveBeenCalledWith(orders);
  });

  test('updateOrderStatus updates and returns order', async () => {
    const order = { save: jest.fn().mockResolvedValue(), status: 'Pending' };
    Order.findById.mockResolvedValue(order);

    const req = { params: { id: '123' }, body: { status: 'Shipped' } };
    const res = { json: jest.fn(), status: jest.fn(() => res) };

    await updateOrderStatus(req, res);

    expect(order.status).toBe('Shipped');
    expect(order.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(order);
  });
});

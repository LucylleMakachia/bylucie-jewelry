import Order from '../models/Order.js';

export async function getTotalSales(startDate, endDate) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { totalRevenue: 0, totalOrders: 0 };
}

export async function getSalesByProduct(startDate, endDate) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: { $ne: 'Cancelled' },
      },
    },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        totalQuantity: { $sum: '$products.quantity' },
        totalSalesAmount: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
      },
    },
    {
      $sort: { totalSalesAmount: -1 },
    },
  ]);
  return result;
}

import { Order } from '../models/Order.js'; // Assuming you have an Order model

export const generateSalesReport = async (startDate, endDate) => {
  try {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).exec();

    let totalSales = 0;
    orders.forEach((order) => {
      totalSales += order.totalAmount;  // Assuming `totalAmount` exists in the Order model
    });

    return {
      totalSales,
      orderCount: orders.length,
      orders,
    };
  } catch (error) {
    throw new Error('Failed to generate sales report');
  }
};


import Order from "../models/Order.js";

// GET /api/reports
export const getSalesReport = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      period = "daily"
    } = req.query;

    // 1. Validate reporting period
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Period must be daily, weekly, or monthly."
      });
    }

    // 2. Build date filter
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date."
          });
        }

        dateFilter.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date."
          });
        }

        // Include the complete end date
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }

      // Validate date range
      if (
        dateFilter.createdAt.$gte &&
        dateFilter.createdAt.$lte &&
        dateFilter.createdAt.$gte > dateFilter.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date."
        });
      }
    }

    // 3. Revenue is calculated only from paid,
    // non-cancelled orders
    const revenueFilter = {
      ...dateFilter,
      paymentStatus: "PAID",
      orderStatus: { $ne: "CANCELLED" }
    };

    // 4. Convert frontend period into MongoDB time unit
    const mongoTimeUnit = {
      daily: "day",
      weekly: "week",
      monthly: "month"
    }[period];

    // 5. Execute report aggregations
    const [
      summaryResult,
      statusBreakdown,
      salesTrend,
      topProducts
    ] = await Promise.all([

      // Sales summary
      Order.aggregate([
        {
          $match: revenueFilter
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$total"
            },
            paidOrders: {
              $sum: 1
            },
            averageOrderValue: {
              $avg: "$total"
            }
          }
        }
      ]),

      // Order status statistics
      Order.aggregate([
        {
          $match: dateFilter
        },
        {
          $group: {
            _id: "$orderStatus",
            count: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            count: -1
          }
        }
      ]),

      // Daily, weekly, or monthly sales trend
      Order.aggregate([
        {
          $match: revenueFilter
        },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: "$createdAt",
                unit: mongoTimeUnit,
                startOfWeek: "Monday"
              }
            },
            revenue: {
              $sum: "$total"
            },
            orders: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            _id: 1
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1,
            orders: 1
          }
        }
      ]),

      // Top 10 best-selling products
      Order.aggregate([
        {
          $match: revenueFilter
        },
        {
          $unwind: "$items"
        },
        {
          $group: {
            _id: "$items.product",
            productName: {
              $first: "$items.name"
            },
            quantitySold: {
              $sum: "$items.quantity"
            },
            revenue: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity"
                ]
              }
            }
          }
        },
        {
          $sort: {
            quantitySold: -1
          }
        },
        {
          $limit: 10
        },
        {
          $project: {
            _id: 0,
            productName: 1,
            quantitySold: 1,
            revenue: 1
          }
        }
      ])
    ]);

    // 6. Prepare summary
    const summary = summaryResult[0] || {
      totalRevenue: 0,
      paidOrders: 0,
      averageOrderValue: 0
    };

    // 7. Calculate order statistics
    const [
      totalOrders,
      completedOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(dateFilter),

      Order.countDocuments({
        ...dateFilter,
        orderStatus: "DELIVERED"
      }),

      Order.countDocuments({
        ...dateFilter,
        orderStatus: "CANCELLED"
      })
    ]);

    // 8. Send final report response
    res.status(200).json({
      success: true,

      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        period
      },

      summary: {
        totalRevenue: summary.totalRevenue,
        paidOrders: summary.paidOrders,
        averageOrderValue: summary.averageOrderValue,
        totalOrders,
        completedOrders,
        cancelledOrders
      },

      statusBreakdown,
      salesTrend,
      topProducts
    });

  } catch (error) {
    next(error);
  }
};

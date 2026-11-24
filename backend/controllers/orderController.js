
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// ---------------- AVAILABLE COUPONS ----------------

const coupons = {
  SWEET10: {
    code: "SWEET10",
    type: "PERCENTAGE",
    value: 10,
    maxDiscount: 200,
    minOrder: 300,
    description: "Get 10% off on orders above ₹300."
  },

  WELCOME15: {
    code: "WELCOME15",
    type: "PERCENTAGE",
    value: 15,
    maxDiscount: 250,
    minOrder: 500,
    description: "Get 15% off on orders above ₹500."
  }
};

// ---------------- COUPON DISCOUNT CALCULATION ----------------

const calculateCouponDiscount = (couponCode, subtotal) => {
  const code = String(couponCode || "").trim().toUpperCase();

  if (!code) {
    return {
      valid: true,
      couponCode: "",
      discountAmount: 0
    };
  }

  const coupon = coupons[code];

  if (!coupon) {
    return {
      valid: false,
      message: "Invalid coupon code."
    };
  }

  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      message: `This coupon requires a minimum order of ₹${coupon.minOrder}.`
    };
  }

  let discountAmount = 0;

  if (coupon.type === "PERCENTAGE") {
    discountAmount = (subtotal * coupon.value) / 100;
    discountAmount = Math.min(
      discountAmount,
      coupon.maxDiscount
    );
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    couponCode: coupon.code,
    discountAmount,
    description: coupon.description
  };
};

// ---------------- VALIDATE COUPON ----------------

export const validateCoupon = async (req, res, next) => {
  try {
    const { items, couponCode } = req.body;

    if (!couponCode || !String(couponCode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty."
      });
    }

    // Combine duplicate products
    const quantities = new Map();

    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Cart contains an invalid product or quantity."
        });
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    // Calculate subtotal using database prices
    let subtotal = 0;

    for (const [productId, quantity] of quantities) {
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isAvailable: true
      });

      if (!product || product.stock < quantity) {
        return res.status(409).json({
          success: false,
          message: "A product is unavailable or has insufficient stock."
        });
      }

      subtotal += Number(product.price) * quantity;
    }

    const result = calculateCouponDiscount(
      couponCode,
      subtotal
    );

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.json({
      success: true,
      message: "Coupon applied successfully.",
      couponCode: result.couponCode,
      discountAmount: result.discountAmount,
      subtotal,
      description: result.description
    });

  } catch (error) {
    next(error);
  }
};


// ---------------- PLACE ORDER ----------------

export const placeOrder = async (req, res, next) => {
  const reservedItems = [];

  try {
    const {
      items,
      deliveryAddress,
      paymentMethod = "COD",
      couponCode = ""
    } = req.body;

    // Validate cart
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty."
      });
    }

    // Validate delivery address
    const address = String(
      deliveryAddress || req.user.deliveryAddress || ""
    ).trim();

    if (address.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a complete delivery address."
      });
    }

    // Validate payment method
    if (!["COD", "SIMULATED_ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method."
      });
    }

    // Combine duplicate products in the cart
    const quantities = new Map();

    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Cart contains an invalid product or quantity."
        });
      }

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + quantity
      );
    }

    const orderItems = [];
    let subtotal = 0;

    // Fetch and validate products before reserving stock
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isAvailable: true
      });

      if (!product || product.stock < quantity) {
        return res.status(409).json({
          success: false,
          message:
            "A product is unavailable or has insufficient stock. Please refresh your cart."
        });
      }

      orderItems.push({
        product,
        quantity
      });

      subtotal += Number(product.price) * quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Validate coupon again using the actual database subtotal
    const couponResult = calculateCouponDiscount(
      couponCode,
      subtotal
    );

    if (!couponResult.valid) {
      return res.status(400).json({
        success: false,
        message: couponResult.message
      });
    }

    const appliedCouponCode = couponResult.couponCode;
    const discountAmount = couponResult.discountAmount;

    // Reserve stock using conditional updates
    for (const line of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: line.product._id,
          isActive: true,
          isAvailable: true,
          stock: { $gte: line.quantity }
        },
        [
          {
            $set: {
              stock: {
                $subtract: ["$stock", line.quantity]
              },
              isAvailable: {
                $gt: [
                  { $subtract: ["$stock", line.quantity] },
                  0
                ]
              }
            }
          }
        ],
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(
          "A product's stock changed during checkout. Please try again."
        );
      }

      reservedItems.push(line);
    }

    const deliveryFee = subtotal >= 999 ? 0 : 50;

    const total = Math.max(
      0,
      Math.round(
        (subtotal - discountAmount + deliveryFee) * 100
      ) / 100
    );

    // Save the order
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems.map(({ product, quantity }) => ({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      })),
      deliveryAddress: address,
      subtotal,
      discountAmount,
      deliveryFee,
      total,
      couponCode: appliedCouponCode,
      paymentMethod,
      paymentStatus:
        paymentMethod === "SIMULATED_ONLINE" ? "PAID" : "PENDING"
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order
    });

  } catch (error) {
    // Restore any stock reserved before an error occurred
    for (const line of reservedItems) {
      try {
        await Product.findByIdAndUpdate(
          line.product._id,
          {
            $inc: { stock: line.quantity },
            $set: { isAvailable: true }
          }
        );
      } catch (restoreError) {
        console.error(
          "Stock restoration failed:",
          restoreError.message
        );
      }
    }

    next(error);
  }
};


// ---------------- CUSTOMER ORDER HISTORY ----------------

export const myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      customer: req.user._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    next(error);
  }
};


// ---------------- ALL ORDERS (STAFF / ADMIN) ----------------

export const allOrders = async (_req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("customer", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    next(error);
  }
};


// ---------------- UPDATE ORDER STATUS ----------------

export const updateOrderStatus = async (req, res, next) => {
  try {
    const allowed = [
      "CONFIRMED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED"
    ];

    if (!allowed.includes(req.body.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status."
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    if (
      order.orderStatus === "CANCELLED" ||
      order.orderStatus === "DELIVERED"
    ) {
      return res.status(409).json({
        success: false,
        message: "This order can no longer be changed."
      });
    }

    if (req.body.orderStatus === "CANCELLED") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);

        if (product) {
          product.stock += item.quantity;
          product.isAvailable =
            product.isActive !== false && product.stock > 0;

          await product.save();
        }
      }
    }

    order.orderStatus = req.body.orderStatus;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated.",
      order
    });

  } catch (error) {
    next(error);
  }
};


// ---------------- CUSTOMER CANCEL ORDER ----------------

export const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    if (!["PLACED", "CONFIRMED"].includes(order.orderStatus)) {
      return res.status(409).json({
        success: false,
        message: "This order is no longer eligible for cancellation."
      });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);

      if (product) {
        product.stock += item.quantity;
        product.isAvailable =
          product.isActive !== false && product.stock > 0;

        await product.save();
      }
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully.",
      order
    });

  } catch (error) {
    next(error);
  }
};

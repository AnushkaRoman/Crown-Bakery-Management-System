
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

const starterProducts = [
  {
    name: "Strawberry Celebration Cake",
    description: "A soft celebration cake layered with strawberry cream.",
    category: "Cakes",
    price: 650,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=85",
    stock: 12,
    lowStockThreshold: 3,
    isAvailable: true
  },
  {
    name: "Butter Croissant",
    description: "A flaky, buttery pastry baked fresh for the day.",
    category: "Pastries",
    price: 95,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&q=85",
    stock: 30,
    lowStockThreshold: 8,
    isAvailable: true
  },
  {
    name: "Chocolate Cupcake",
    description: "A rich chocolate cupcake with smooth frosting.",
    category: "Cupcakes",
    price: 120,
    image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=900&q=85",
    stock: 24,
    lowStockThreshold: 6,
    isAvailable: true
  },
  {
    name: "Artisan Sourdough",
    description: "A small-batch loaf with a crisp crust and soft centre.",
    category: "Breads",
    price: 180,
    image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=900&q=85",
    stock: 15,
    lowStockThreshold: 4,
    isAvailable: true
  },
  {
    name: "Raspberry Macarons",
    description: "Delicate almond treats with raspberry filling.",
    category: "Cookies",
    price: 240,
    image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=900&q=85",
    stock: 20,
    lowStockThreshold: 5,
    isAvailable: true
  },
  {
    name: "Cinnamon Rolls",
    description: "Soft cinnamon rolls finished with a sweet glaze.",
    category: "Pastries",
    price: 150,
    image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=900&q=85",
    stock: 18,
    lowStockThreshold: 5,
    isAvailable: true
  }
];

async function seedProducts() {
  try {
    await connectDB();

    let added = 0;

    for (const item of starterProducts) {
      const existing = await Product.findOne({
        name: item.name
      });

      if (!existing) {
        await Product.create(item);
        added++;
      }
    }

    console.log(`${added} new products added successfully.`);
    console.log("Existing products were kept unchanged.");

  } catch (error) {
    console.error("Product seeding failed:", error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();

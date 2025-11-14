import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  try {
    
    await db.query(`
      DELETE FROM orders_products;
      DELETE FROM orders;
      DELETE FROM products;
      DELETE FROM users;
    `);

    const {
      rows: [user],
    } = await db.query(
      `
      INSERT INTO users (username, password)
      VALUES ($1, $2)
      RETURNING *;
      `,
      ["keyshia cole", "neverknewwhatiwasmissin"]
    );

    
    const { rows: products } = await db.query(`
      INSERT INTO products (title, description, price)
      VALUES
        ('T-Shirt', 'Soft cotton shirt', 20),
        ('Jeans', 'Blue denim jeans', 45),
        ('Sneakers', 'Running shoes', 60),
        ('Hat', 'Stylish cap', 15),
        ('Watch', 'Wrist watch', 55),
        ('Backpack', 'Daily backpack', 40),
        ('Sunglasses', 'UV sunglasses', 35),
        ('Jacket', 'Light jacket', 50),
        ('Socks', 'Pack of 5', 10),
        ('Belt', 'Leather belt', 25)
      RETURNING *;
    `);

    
    const {
      rows: [order],
    } = await db.query(
      `
      INSERT INTO orders (date, note, user_id)
      VALUES (CURRENT_DATE, $1, $2)
      RETURNING *;
      `,
      ["First order for Keyshia Cole", user.id]
    );

    
    const firstFive = products.slice(0, 5);

    for (const product of firstFive) {
      await db.query(
        `
        INSERT INTO orders_products (order_id, product_id, quantity)
        VALUES ($1, $2, $3);
        `,
        [order.id, product.id, 1]
      );
    }

    console.log(" Seed complete!");
  } catch (err) {
    console.error(" Error seeding database:", err);
    throw err;
  }
}
import express from "express";
import db from "../db/client.js";
import requireUser from "../middleware/requireUser.js";

const router = express.Router();


router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM products
      ORDER BY id;
    `);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});


router.get("/:id/orders", requireUser, async (req, res, next) => {
  try {
    const productId = req.params.id;

    
    const { rows: productRows } = await db.query(
      `
        SELECT * FROM products
        WHERE id = $1;
      `,
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).send({ error: "Product not found" });
    }

    
    const { rows: orders } = await db.query(
      `
        SELECT o.*
        FROM orders o
        JOIN orders_products op ON o.id = op.order_id
        WHERE op.product_id = $1
          AND o.user_id = $2
        ORDER BY o.id;
      `,
      [productId, req.user.id]
    );

    res.send(orders);
  } catch (err) {
    next(err);
  }
});


router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: productRows } = await db.query(
      `
        SELECT * FROM products
        WHERE id = $1;
      `,
      [id]
    );

    const product = productRows[0];

    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    res.send(product);
  } catch (err) {
    next(err);
  }
});

export default router;

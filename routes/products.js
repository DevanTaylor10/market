import express from "express";
import db from "../db/client.js";
import requireUser from "../middleware/requireUser.js";

const router = express.Router();


router.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM products;");
    res.send(rows);
  } catch (err) {
    next(err);
  }
});


router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "SELECT * FROM products WHERE id = $1;",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send({ error: "Product not found" });
    }

    res.send(rows[0]);
  } catch (err) {
    next(err);
  }
});


router.get("/:id/orders", requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    
    const productCheck = await db.query(
      "SELECT id FROM products WHERE id = $1;",
      [id]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).send({ error: "Product not found" });
    }

    const { rows } = await db.query(
      `
      SELECT orders.* 
      FROM orders
      JOIN orders_products ON orders.id = orders_products.order_id
      WHERE orders_products.product_id = $1
        AND orders.user_id = $2;
    `,
      [id, req.user.id]
    );

    res.send(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
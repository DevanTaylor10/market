import express from "express";
import db from "../db/client.js";
import requireUser from "../middleware/requireUser.js";

const router = express.Router();

router.post("/", requireUser, async (req, res, next) => {
  try {
    const { date, note } = req.body;

    if (!date) {
      return res.status(400).send({ error: "date is required" });
    }

    const {
      rows: [order],
    } = await db.query(
      `
      INSERT INTO orders (date, note, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [date, note ?? null, req.user.id]
    );

    res.status(201).send(order);
  } catch (err) {
    next(err);
  }
});

router.get("/", requireUser, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM orders WHERE user_id = $1;",
      [req.user.id]
    );
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

async function getOrderOrThrow(id, userId) {
  const {
    rows: [order],
  } = await db.query("SELECT * FROM orders WHERE id = $1;", [id]);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.user_id !== userId) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  return order;
}

router.get("/:id/orders", requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `
      SELECT o.*
      FROM orders o
      JOIN orders_products op
        ON o.id = op.order_id
      WHERE op.product_id = $1
      AND o.user_id = $2;
      `,
      [id, req.user.id]
    );

    res.send(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/products", requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).send({
        error: "productId and quantity are required",
      });
    }

    await getOrderOrThrow(id, req.user.id);

    const {
      rows: [product],
    } = await db.query("SELECT * FROM products WHERE id = $1;", [productId]);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    const {
      rows: [orderProduct],
    } = await db.query(
      `
      INSERT INTO orders_products (order_id, product_id, quantity)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [id, productId, quantity]
    );

    res.status(201).send(orderProduct);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/products", requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    await getOrderOrThrow(id, req.user.id);

    const { rows } = await db.query(
      `
      SELECT p.*, op.quantity
      FROM orders_products op
      JOIN products p ON p.id = op.product_id
      WHERE op.order_id = $1;
      `,
      [id]
    );

    res.send(rows);
  } catch (err) {
    next(err);
  }
});

export default router;

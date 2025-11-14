import express from "express";
import morgan from "morgan";
import cors from "cors";

import usersRouter from "./routes/users.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";

const app = express();


app.use(cors());
app.use(morgan("dev"));
app.use(express.json());


app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

export default app;
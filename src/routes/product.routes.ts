import { Router } from "express";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller";

const router = Router();

// GET /api/products
router.get("/", getProducts);

// POST /api/products
router.post("/", createProduct);

// PATCH /api/products/:id
router.patch("/:id", updateProduct);

// DELETE /api/products/:id
router.delete("/:id", deleteProduct);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
// GET /api/products
router.get("/", product_controller_1.getProducts);
// POST /api/products
router.post("/", product_controller_1.createProduct);
// PATCH /api/products/:id
router.patch("/:id", product_controller_1.updateProduct);
// DELETE /api/products/:id
router.delete("/:id", product_controller_1.deleteProduct);
exports.default = router;

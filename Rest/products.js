const express = require("express");
const postgres = require("postgres");
const z = require("zod");

const app = express();
const port = 8000;
const sql = postgres({ db: "mydb", user: "user", password: "password" });

app.use(express.json());

// Schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});
const CreateProductSchema = ProductSchema.omit({ id: true });

app.post("/products", async (req, res) => {
  const result = await CreateProductSchema.safeParse(req.body);

  // If Zod parsed successfully the request body
  if (result.success) {
    const { name, about, price } = result.data;

    const product = await sql`
    INSERT INTO products (name, about, price)
    VALUES (${name}, ${about}, ${price})
    RETURNING *
    `;

    res.send(product[0]);
  } else {
    res.status(400).send(result);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

app.get("/products", async (req, res) => {
  const products = await sql`SELECT * FROM products`;
  res.json(products);
});

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const product = await sql`SELECT * FROM products WHERE id = ${id}`;
  if (product.length === 0) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }
  res.json(product[0]);
});

app.post("/products", async (req, res) => {
  const { name, about,  price } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: "Nom et prix sont requis" });
  }
  const newProduct = await sql`
    INSERT INTO products (name, about, price)
    VALUES (${name}, ${about}, ${price})
    RETURNING *
  `;
  res.status(201).json(newProduct[0]);
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await sql`
    DELETE FROM products
    WHERE id = ${id}
    RETURNING *
  `;
  if (deletedProduct.length === 0) {
    return res.status(404).json({ error: "Produit non trouvé" });
  }
  res.json(deletedProduct[0]);
});
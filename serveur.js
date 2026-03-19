const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const X = 400; // Bad Request
const postgres = require("postgres");

const sql = postgres({
  host: "localhost",
  port: 5432,
  database: "products",
  username: "postgres",
  password: "password",
});

// Define the service implementation
const service = {
  ProductsService: {
    ProductsPort: {
      CreateProduct: async function ({ name, about, price }, callback) {
        if (!name || !about || !price) {
          throw {
            Fault: {
              Code: {
                Value: "soap:Sender",
                Subcode: { value: "rpc:BadArguments" },
              },
              Reason: { Text: "Processing Error" },
              statusCode: X,
            },
          };
        }
        const product = await sql`
          INSERT INTO products (name, about, price)
          VALUES (${name}, ${about}, ${price})
          RETURNING *
        `;
        callback({ product: product[0] });
      },
    },
  },
};

// http server example
const server = http.createServer(function (request, response) {
  response.end("404: Not Found: " + request.url);
});

server.listen(8000);

// Create the SOAP server
const xml = fs.readFileSync("soap/ProductsService.wsdl", "utf8");
soap.listen(server, "/products", service, xml, function () {
  console.log("SOAP server running at http://localhost:8000/products?wsdl");
});
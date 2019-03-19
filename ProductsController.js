const Responses = require("sabio-web-models").Responses;
const BaseController = require("../BaseController");
const productService = require("sabio-services").productService;
const emailService = require("sabio-services").emailService;
const { Product } = require("sabio-models").Schemas;
const { RoutePrefix, Route } = require("sabio-routing");

const createProductSchema = Product.createProductSchema;
const updateProductSchema = Product.updateProductSchema;

@RoutePrefix("/api/products")
class ProductsController extends BaseController {
  constructor() {
    super("ProductsController");
  }

  @Route("GET", "")
  getAllProducts(req, res, next) {
    productService
      .getAllProducts()
      .then(data => {
        const sResponse = new Responses.ItemsResponse(data);
        res.json(sResponse);
      })
      .catch(err => {
        res.status(500).send(err);
      });
  }

  @Route("GET", ":id(\\d+)")
  getProductById(req, res, next) {
    const productId = req.params.id;
    productService.getProductById(productId).then(data => {
      const sResponse = new Responses.ItemsResponse(data);
      res.json(sResponse).catch(err => {
        res.status(500).send(err);
      });
    });
  }

  @Route("POST", "new", createProductSchema)
  createProduct(req, res) {
    productService
      .createProduct(req.body, req.user.id)
      .then(data => {
        const response = new Responses.ItemResponse(data);
        const productId = response.item;
        const userEmail = req.user.name;
        res.json(response);
        emailService.sendProductEmail(productId, userEmail);
      })
      .catch(err => {
        res.status(500).send(err);
      });
  }

  @Route("PUT", "", updateProductSchema)
  updateProduct(req, res) {
    productService
      .updateProduct(req.body, req.user.id)
      .then(data => {
        res.json(new Responses.ItemResponse(data));
      })
      .catch(err => {
        res.status(500).send(err);
      });
  }
}

module.exports = { controller: ProductsController };

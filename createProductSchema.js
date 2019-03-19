const joi = require("joi");
const Schema = require("../Schema");

const createProductValidator = joi.object({
  title: joi
    .string()
    .min(1)
    .max(50)
    .required(),
  quantity: joi
    .number()
    .min(0)
    .required(),
  sku: joi
    .string()
    .alphanum()
    .allow(""),
  description: joi
    .string()
    .min(1)
    .max(500)
    .required(),
  baseTax: joi 
    .number()
    .precision(4)
    .min(0)
    .max(1)
    .required(),
  basePrice: joi
    .number()
    .precision(4)
    .min(0)
    .max(99999999)
    .required(),
  currentPrice: joi
    .number()
    .precision(4)
    .min(0)
    .max(99999999)
    .required(),
  categoryId: joi
    .number()
    .min(1)
    .required(),
  mainImage: joi,
  metaTagId: joi,
  isDeleted: joi
    .boolean()
    .truthy(1)
    .falsy(0),
  isVisible: joi
    .boolean()
    .truthy(1)
    .falsy(0)
});

module.exports = new Schema(createProductValidator);

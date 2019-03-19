const { dataProvider, TYPES } = require("sabio-data");
const Cache = require("./Cache/CacheService");

const createSqlProductMappings = {
  title: ["Title", TYPES.NVarChar],
  quantity: ["Quantity", TYPES.Int],
  sku: ["SKU", TYPES.NVarChar],
  description: ["Description", TYPES.NVarChar],
  baseTax: ["BaseTax", TYPES.Money],
  basePrice: ["BasePrice", TYPES.Money],
  currentPrice: ["CurrentPrice", TYPES.Money],
  categoryId: ["ProductCategoryId", TYPES.Int],
  mainImage: ["MainImage", TYPES.NVarChar],
  metaTagId: ["MetaTagId", TYPES.Int],
  isVisible: ["isVisible", TYPES.Bit],
  isDeleted: ["isDeleted", TYPES.Bit]
};

const updateSqlProductMappings = {
  ...createSqlProductMappings,
  id: ["Id", TYPES.Int]
};

const fromBooleanToBinary = data => {
  return data ? 1 : 0;
};

const fromBinaryToBoolean = data => {
  // input param is 1 or 0
  return Boolean(data);
};

let onWriteTransform = {
  isDeleted: fromBooleanToBinary,
  isVisible: fromBooleanToBinary
};

let onReadTransformMapping = {
  isDeleted: fromBinaryToBoolean,
  isVisible: fromBinaryToBoolean
};

const transformOnWrite = product => {
  for (const key in onWriteTransform) {
    const val = product[key];
    const convert = onWriteTransform[key];
    product[key] = convert(val);
  }
};

const transformOnGet = product => {
  for (const key in onReadTransformMapping) {
    const val = product[key];
    const convert = onReadTransformMapping[key]; //call convert converter
    product[key] = convert(val);
  }
};

const ttl = 60 * 60 * 1;
const cache = new Cache(ttl);

class ProductService {
  getAllProducts() {
    let procName = "dbo.Products_SelectAll";
    let inputParamMapper = null;
    let returnParamMapper = null;
    let results = null;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      dataProvider.executeCmd(
        procName,
        inputParamMapper,
        singleRecordMapper,
        returnParamMapper,
        onComplete
      );

      function singleRecordMapper(record) {
        // should this if statement be if(results != null) instead?
        if (results === null) {
          results = [];
        }

        if (record.isVisible === true && record.isDeleted === false) {
          transformOnGet(record);
          results.push(record);
        }
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      }
    }
  }

  getAllProductsMerchant(userId, pageIndex, pageSize) {
    let procName = "dbo.Products_SelectAllColumnsPaginatedForMerchant";
    let returnParamMapper = null;
    let results = null;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      dataProvider.executeCmd(
        procName,
        inputParamMapper,
        singleRecordMapper,
        returnParamMapper,
        onComplete
      );

      function inputParamMapper(sqlParameters) {
        sqlParameters.addParameter("UserId", TYPES.Int, userId);
        sqlParameters.addParameter("PageIndex", TYPES.Int, pageIndex);
        sqlParameters.addParameter("PageSize", TYPES.Int, pageSize);
      }

      function singleRecordMapper(record) {
        if (results === null) {
          results = [];
        }
        transformOnGet(record);
        results.push(record);
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      }
    }
  }

  searchAllProductsMerchant(userId, pageIndex, pageSize, search) {
    let procName = "dbo.Products_SearchPaginated";
    let returnParamMapper = null;
    let results = null;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      dataProvider.executeCmd(
        procName,
        inputParamMapper,
        singleRecordMapper,
        returnParamMapper,
        onComplete
      );

      function inputParamMapper(sqlParameters) {
        sqlParameters.addParameter("UserId", TYPES.Int, userId);
        sqlParameters.addParameter("PageIndex", TYPES.Int, pageIndex);
        sqlParameters.addParameter("PageSize", TYPES.Int, pageSize);
        sqlParameters.addParameter("Search", TYPES.NVarChar, search);
      }

      function singleRecordMapper(record) {
        if (results === null) {
          results = [];
        }
        transformOnGet(record);
        results.push(record);
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      }
    }
  }

  getProductById(id) {
    let procName = "dbo.Products_SelectById";
    let returnParamMapper = null;

    let results = null;
    const key = `getProductById_${id}`;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      let product = cache.get(key);

      if (product) {
        resolve(product);
        return;
      }

      dataProvider.executeCmd(
        procName,
        inputParamMapper,
        singleRecordMapper,
        returnParamMapper,
        onComplete
      );

      function inputParamMapper(sqlParameters) {
        sqlParameters.addParameter("Id", TYPES.Int, id);
      }

      function singleRecordMapper(record, resultSet) {
        // if (results === null) {
        //   results = [];
        // }

        transformOnGet(record);
        results = record;
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }
        cache.set(key, results);
        resolve(results);
      }
    }
  }

  createProduct(productAddRequest, userId) {
    let procName = "dbo.Products_InsertV2";
    let productCreated = null;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      dataProvider.executeNonQuery(
        procName,
        inputParamMapper,
        returnParamMapper,
        onComplete
      );

      function inputParamMapper(sqlParameters) {
        transformOnWrite(productAddRequest);

        for (const key in productAddRequest) {
          let itemToInsert = productAddRequest[key];
          let sqlMapping = createSqlProductMappings[key];

          sqlParameters.addParameter(
            sqlMapping[0],
            sqlMapping[1],
            itemToInsert
          );
        }

        sqlParameters.addParameter("CreatedBy", TYPES.Int, userId);
        sqlParameters.addOutputParameter("Id", TYPES.Int);
      }

      function returnParamMapper(sqlParameters) {
        productCreated = sqlParameters.id;
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(productCreated);
      }
    }
  }

  updateProduct(productUpdateRequest, userId) {
    let procName = "dbo.Products_Update";
    let returnParamMapper = null;

    const key = `getProductById_${productUpdateRequest.id}`;

    return new Promise(promiseExecutor);

    function promiseExecutor(resolve, reject) {
      dataProvider.executeNonQuery(
        procName,
        inputParamMapper,
        returnParamMapper,
        onComplete
      );

      function inputParamMapper(sqlParameters) {
        transformOnWrite(productUpdateRequest);

        for (const key in productUpdateRequest) {
          let itemToUpdate = productUpdateRequest[key];
          let sqlMappingUpdate = updateSqlProductMappings[key];
          sqlParameters.addParameter(
            sqlMappingUpdate[0],
            sqlMappingUpdate[1],
            itemToUpdate
          );
        }
        sqlParameters.addParameter("ModifiedBy", TYPES.Int, userId);
      }

      function onComplete(err) {
        if (err) {
          reject(err);
          return;
        }
        cache.del(key);
        resolve();
      }
    }
  }
}

const productService = new ProductService();

module.exports = productService;

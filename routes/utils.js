const formatLinkHeader = require('format-link-header');

/**
 * Responds with 415 status code if the request body is not a valid JSON
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.requireJson = function(req, res, next) {
  if (req.is('application/json')) {
    next();
  } else {
    res.status(415).send('Content-Type must be application/json');
  }
};


/**
 *
 * @param {ExpressRequest} req - The Express request object
 * @returns an object with the following properties
 */
exports.getPaginationParameters = function(req) {
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let perPage = parseInt(req.query.perPage, 10);
  if (isNaN(perPage) || perPage < 0 || perPage > 10) {
    perPage = 10;
  }

  return { page, perPage };
};

exports.addLinkHeader = function(ressourceHref, page, perPage, total, res) {
  const links = {};
  const url = baseURl + ressourceHref;
  const maxPage = Math.ceil(total / perPage);


  if (page > 1) {
    links.first = {rel: 'first', url: `{$url}?page=${page+1}&pageSize=${perPage}`};
    links.prev = {rel: 'prev', url: `{$url}?page=${page-1}&pageSize=${perPage}`};
  }

  if (page < maxPage) {
    links.next = {rel: 'next', url: `{$url}?page=${page+1}&pageSize=${perPage}`};
    links.last = {rel: 'last', url: `{$url}?page=${maxPage}&pageSize=${perPage}`};
  }

  if (Object.keys(links).length >=1) {
    res.set('Link', formatLinkHeader(links));
  }
}

exports.responseShouldInclude = function(req, property){

  //get the "include" URL parameter
  let propertiesToInclude = req.query.include;
  if (!propertiesToInclude) {
    return false;
  }

  if(!Array.isArray(propertiesToInclude)){
    propertiesToInclude = [propertiesToInclude];
  }

  return propertiesToInclude.indexOf(property) >=0;
};

/**
 * @apiDefine Pagination
 * @apiParam {Number} [page] The page number to retrieve.
 * @apiParam {Number} [perPage] The number of items per page.
 * @apiSuccess {String} Link Links to the first, previous, next and last pages.
 */


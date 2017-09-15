const sanitizeHtml = require('sanitize-html');
const autoBind = require('auto-bind');

class Meta {
  constructor(config = {}) {
    this.config = Object.assign({ '/': ['', ''] }, config);
    // ensure all config keys are arrays with two keys
    Object.keys(this.config).forEach(path => {
      if (!Array.isArray(this.config[path]))
        throw new Error(`path "${path}" was not an array`);
      // slice only the first two keys (0 = title, 1 = description)
      this.config[path] = this.config[path].slice(0, 2);
      // ensure it has both keys
      if (this.config[path].length !== 2)
        throw new Error(`path "${path}" must have exactly two keys`);
      // ensure both keys are strings
      if (typeof this.config[path][0] !== 'string')
        throw new Error(`path "${path}" needs String for title`);
      if (typeof this.config[path][1] !== 'string')
        throw new Error(`path "${path}" needs String for description`);
    });
    autoBind(this);
  }
  getByPath(path, t, originalPath) {
    if (typeof path !== 'string')
      throw new Error('path is required and must be a String');

    if (originalPath === null || typeof originalPath === 'undefined')
      originalPath = path;

    if (t !== null && typeof t !== 'undefined' && typeof t !== 'function')
      throw new Error('t must be a Function');

    if (typeof originalPath !== 'string')
      throw new Error('originalPath must be a String');

    // if we traversed recursively this would be empty due to substring below
    if (path === '') path = '/';

    if (
      originalPath !== '/' &&
      originalPath.lastIndexOf('/') !== 0 &&
      path === '/'
    )
      throw new Error(`path "${path}" needs a meta config key defined`);

    let key = this.config[path];

    // it should traverse up and split by / till it finds a parent route
    if (!key)
      return this.getByPath(
        path.substring(0, path.lastIndexOf('/')),
        t,
        originalPath
      );

    // translate the meta information
    key = key.map(str => {
      // this has built in support for @ladjs/i18n via `ctx.req.t`
      if (t) {
        // replace `|` pipe character because
        // translation will interpret as ranged interval
        // <https://github.com/mashpie/i18n-node/issues/274>
        str = str.replace(/\|/g, '&#124;');
        str = t(str);
      }

      return sanitizeHtml(str, {
        allowedTags: [],
        allowedAttributes: []
      });
    });

    return { title: key[0], description: key[1] };
  }
  middleware(ctx, next) {
    // return early if it's not a GET or is an xhr request
    if (
      ctx.method !== 'GET' ||
      ctx.request.get('X-Requested-With') === 'XMLHttpRequest'
    )
      return next();

    //
    // lookup page title and description
    //
    // this has built in support for @ladjs/i18n
    // since it exposes `ctx.pathWithoutLocale`
    const data = this.getByPath(ctx.pathWithoutLocale || ctx.path, ctx.req.t);
    Object.assign(ctx.state, { meta: {} });
    Object.assign(ctx.state.meta, data);
    return next();
  }
}

module.exports = Meta;

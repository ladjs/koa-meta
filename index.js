const sanitizeHtml = require('sanitize-html');

class Meta {
  constructor(config = {}, logger = console) {
    this.config = { '/': ['', ''], ...config };
    this.logger = logger;
    // ensure all config keys are arrays with two keys
    Object.keys(this.config).forEach((path) => {
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
    this.getByPath = this.getByPath.bind(this);
    this.middleware = this.middleware.bind(this);
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

    let key = this.config[path];

    // it should traverse up and split by / till it finds a parent route
    if (!key)
      if (path === '/' || path.slice(0, path.lastIndexOf('/')) === '')
        throw new Error(`path "${path}" needs a meta config key defined`);
      else
        return this.getByPath(
          path.slice(0, path.lastIndexOf('/')),
          t,
          originalPath
        );

    // translate the meta information
    key = key.map((string) => {
      // this has built in support for @ladjs/i18n via `ctx.request.t`
      if (t) {
        // replace `|` pipe character because
        // translation will interpret as ranged interval
        // <https://github.com/mashpie/i18n-node/issues/274>
        string = string.replace(/\|/g, '&#124;');
        string = t(string);
      }

      return sanitizeHtml(string, {
        allowedTags: [],
        allowedAttributes: []
      });
    });

    return { title: key[0], description: key[1] };
  }

  middleware(ctx, next) {
    // return early if there was no `ctx.render` bound
    if (!ctx.render) return next();

    // provide a default `ctx.state.meta` object used in routes/middleware
    Object.assign(ctx.state, { meta: {} });

    //
    // NOTE: we only should populate `ctx.state.meta` on ctx.render calls
    //
    // lookup page title and description
    //
    // this has built in support for @ladjs/i18n
    // since it exposes `ctx.pathWithoutLocale`
    const { getByPath, logger } = this;
    const { render } = ctx;
    // override existing render
    ctx.render = function (...args) {
      let data = {};
      try {
        data = getByPath(ctx.pathWithoutLocale || ctx.path, ctx.request.t);
      } catch (err) {
        logger.error(err);
        data = getByPath('/', ctx.request.t);
      }

      Object.assign(ctx.state.meta, data);
      return render.call(this, ...args);
    };

    return next();
  }
}

module.exports = Meta;

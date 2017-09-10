const test = require('ava');

const SEO = require('../');

const next = () => {};
const req = {};
const getRequest = () => {
  return {
    headers: {},
    get(prop) {
      return this.headers[prop];
    }
  };
};

test('returns itself', t => {
  t.true(new SEO() instanceof SEO);
});

test('middleware should ignore xhr requests', t => {
  const seo = new SEO();
  const ctx = {
    path: '/',
    method: 'POST',
    state: {},
    request: getRequest(),
    req
  };
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {});
  ctx.method = 'GET';
  ctx.request.headers['X-Requested-With'] = 'XMLHttpRequest';
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {});
});

test('middleware should work', t => {
  const seo = new SEO({
    '/': ['Home', 'Our home page description']
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req
  };
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Home',
      description: 'Our home page description'
    }
  });
});

test('middleware should sanitize html', t => {
  const seo = new SEO({
    '/': ['<strong>Home</strong>', 'Our <strong>home page</strong> description']
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req
  };
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Home',
      description: 'Our home page description'
    }
  });
});

test('set an invalid config path without an array', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO({ '/': false });
  });
  t.regex(error.message, /was not an array/);
});

test('set an invalid config path without two keys', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO({ '/': [] });
  });
  t.regex(error.message, /must have exactly two keys/);
});

test('set an invalid config key title', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO({ '/': [false, false] });
  });
  t.regex(error.message, /needs String for title/);
});

test('set an invalid config key description', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO({ '/': ['', false] });
  });
  t.regex(error.message, /needs String for description/);
});

test('translation function', t => {
  const seo = new SEO({
    '/': ['Home', 'Our home page description']
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: Object.assign(
      {
        t: str =>
          str
            .split('')
            .reverse()
            .join('')
      },
      req
    )
  };
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Home'
        .split('')
        .reverse()
        .join(''),
      description: 'Our home page description'
        .split('')
        .reverse()
        .join('')
    }
  });
});

test('uses parent meta on nested path', t => {
  const seo = new SEO({
    '/': ['Home', 'Our home page description'],
    '/blog': ['Blog', 'Our blog and more about our company']
  });
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req
  };
  seo.middleware(ctx, next);
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Blog',
      description: 'Our blog and more about our company'
    }
  });
});

test('throws error on nested path without parent meta', t => {
  const seo = new SEO({
    '/': ['Home', 'Our home page description']
  });
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req
  };
  const error = t.throws(() => {
    seo.middleware(ctx, next);
  });
  t.regex(error.message, /needs a meta config key defined/);
});

test('getByPath throws error without `path` string', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO().getByPath();
  });
  t.is(error.message, 'path is required and must be a String');
});

test('getByPath throws error with `t` defined non-function', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO().getByPath('/', false);
  });
  t.is(error.message, 't must be a Function');
});

test('getByPath throws error without `originalPath` string', t => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new SEO().getByPath('/', null, false);
  });
  t.is(error.message, 'originalPath must be a String');
});

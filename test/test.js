const test = require('ava');
const sinon = require('sinon');

const Meta = require('..');

const next = () => {};
const request = {};
const getRequest = (t = false) => {
  return {
    headers: {},
    get(prop) {
      return this.headers[prop];
    },
    ...(t
      ? {
          t: (string) => [...string].reverse().join(''),
        }
      : {}),
  };
};

test('returns itself', (t) => {
  t.true(new Meta() instanceof Meta);
});

test('middleware should work', (t) => {
  const meta = new Meta({
    '/': ['Home', 'Our home page description'],
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  meta.middleware(ctx, next);
  ctx.render();
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Home',
      description: 'Our home page description',
    },
  });
});

test('middleware should sanitize html', (t) => {
  const meta = new Meta({
    '/': [
      '<strong>Home</strong>',
      'Our <strong>home page</strong> description',
    ],
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  meta.middleware(ctx, next);
  ctx.render();
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Home',
      description: 'Our home page description',
    },
  });
});

test('set an invalid config path without an array', (t) => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new Meta({'/': false});
  });
  t.regex(error.message, /was not an array/);
});

test('set an invalid config path without two keys', (t) => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new Meta({'/': []});
  });
  t.regex(error.message, /must have exactly two keys/);
});

test('set an invalid config key title', (t) => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new Meta({'/': [false, false]});
  });
  t.regex(error.message, /needs String for title/);
});

test('set an invalid config key description', (t) => {
  const error = t.throws(() => {
    // eslint-disable-next-line no-new
    new Meta({'/': ['', false]});
  });
  t.regex(error.message, /needs String for description/);
});

test('translation function', (t) => {
  const meta = new Meta({
    '/': ['Home', 'Our home page description'],
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(true),
    req: request,
    render() {},
  };
  meta.middleware(ctx, next);
  ctx.render();
  t.deepEqual(ctx.state, {
    meta: {
      title: [...'Home'].reverse().join(''),
      description: [...'Our home page description'].reverse().join(''),
    },
  });
});

test('uses parent meta on nested path', (t) => {
  const meta = new Meta({
    '/': ['Home', 'Our home page description'],
    '/blog': ['Blog', 'Our blog and more about our company'],
  });
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  meta.middleware(ctx, next);
  ctx.render();
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Blog',
      description: 'Our blog and more about our company',
    },
  });
});

test('throws error on nested path without parent home meta', (t) => {
  const meta = new Meta({});
  const ctx = {
    path: '/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  const spy = sinon.spy(console, 'error');
  meta.middleware(ctx, next);
  ctx.render();
  spy.calledWithMatch('path "/123" needs a meta config key defined');
  spy.restore();
  t.pass();
});

test('does not add to ctx.state.meta when no ctx.render', (t) => {
  const meta = new Meta({
    '/': ['Home', 'Our home page description'],
  });
  const ctx = {
    path: '/',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
  };
  meta.middleware(ctx, next);
  t.deepEqual(ctx.state, {});
});

test('throws error on nested path without parent blog meta', (t) => {
  const meta = new Meta({
    '/': ['Home', 'Our home page description'],
  });
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  const spy = sinon.spy(console, 'error');
  meta.middleware(ctx, next);
  ctx.render();
  spy.calledWithMatch('path "/blog" needs a meta config key defined');
  spy.restore();
  t.pass();
});

test('getByPath throws error without `path` string', (t) => {
  const error = t.throws(() => {
    new Meta().getByPath();
  });
  t.is(error.message, 'path is required and must be a String');
});

test('getByPath throws error with `t` defined non-function', (t) => {
  const error = t.throws(() => {
    new Meta().getByPath('/', false);
  });
  t.is(error.message, 't must be a Function');
});

test('getByPath throws error without `originalPath` string', (t) => {
  const error = t.throws(() => {
    new Meta().getByPath('/', null, false);
  });
  t.is(error.message, 'originalPath must be a String');
});

test('throws levelForMissing of warn on nested path without parent blog meta', (t) => {
  const meta = new Meta(
    {
      '/': ['Home', 'Our home page description'],
    },
    console,
    'warn',
  );
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {},
    request: getRequest(),
    req: request,
    render() {},
  };
  const spy = sinon.spy(console, 'warn');
  meta.middleware(ctx, next);
  ctx.render();
  spy.calledWithMatch('path "/blog" needs a meta config key defined');
  spy.restore();
  t.pass();
});

test('does not override existing meta', (t) => {
  const meta = new Meta(
    {
      '/': ['Home', 'Our home page description'],
    },
    console,
    'warn',
  );
  const ctx = {
    path: '/blog/123',
    method: 'GET',
    state: {
      meta: {
        title: 'Title',
        description: 'Description',
      },
    },
    request: getRequest(),
    req: request,
    render() {},
  };
  meta.middleware(ctx, next);
  ctx.render();
  t.deepEqual(ctx.state, {
    meta: {
      title: 'Title',
      description: 'Description',
    },
  });
});

# koa-meta

[![build status](https://img.shields.io/travis/ladjs/koa-meta.svg)](https://travis-ci.org/ladjs/koa-meta)
[![code coverage](https://img.shields.io/codecov/c/github/ladjs/koa-meta.svg)](https://codecov.io/gh/ladjs/koa-meta)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/ladjs/koa-meta.svg)](<>)

> Meta `<title>` and `<meta name="description">` middleware for Koa and Lad


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Translation Support](#translation-support)
* [Child Path Support](#child-path-support)
* [Error Catching](#error-catching)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install koa-meta
```

[yarn][]:

```sh
yarn add koa-meta
```


## Usage

> Use middleware:

```js
const Meta = require('koa-meta');

/// ...

const meta = new Meta({
  '/': [ 'Home', 'Our home page description' ],
  '/contact', [ 'Contact', 'Contact us with questions' ]
});

// note: you can also pass a second argument of a custom `logger`
// the default logger is `console` and must have a `.error` method
// `const meta = new Meta({}, console);`

app.use(meta.middleware);

app.use((ctx, next) => {
  // since the previous middleware was defined before this
  // the `ctx.state` object has been populated with metadata
  console.log('ctx.state.meta', ctx.state.meta);
  // for a request with `ctx.path` of `/` it will output:
  // { title: 'Home', description: 'Our home page description' }
});
```

Therefore in your views you can render the meta data easily:

```pug
doctype html
html
  head
    title= meta.title
    meta(name="description", content=meta.description)
```

> Get a meta translation:

```js
const Meta = require('koa-meta');

const meta = new Meta({
  '/': [ 'Home', 'Our home page description' ],
  '/posts': [ 'Posts', 'Posts by our team' ]
});

console.log(meta.getByPath('/posts/123456'));
// `{ title: 'Posts', description: 'Posts by our team' }`
```


## Translation Support

This package supports translation out of the box.

It checks for a function set on `ctx.request.t` and utilizes that function to translate based off the request's locale.


## Child Path Support

This package supports parent meta data lookup for children of paths.

This means if you define in your configuration a path of `/posts` and a request is made to `/posts/123456` (with this path not being defined in your configuration), then it will use `/posts` definition for `/posts/123456`.


## Error Catching

By default this package will throw an error if a child path was found that does not have a parent defined.

This is extremely useful for retaining quality control with your configuration.


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

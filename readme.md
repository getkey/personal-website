# [Getkey.eu](https://getkey.eu)

This is my personal website.

## Setup

Install [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.org/). Then `npm install` will take care of the others dependencies.

## Starting it! 

``` sh
$ node index.js start 8080
```

It can then be accessed at [http://localhost:8080](http://localhost:8080).

### Generating Nginx and systemd config files

```sh
$ utils/generate_config.sh
```

You will be able to find them in `./generated/`.

### Regenerating the cache

```sh
$ node index.js regenerate-cache
```

### Set a password

This password is needed to post or edit blogposts.

```sh
$ node index.js set-password
```

The hash will be saved as `hash.txt`.

## How to post on the blog

Make sure you have [set a password](#set-a-password).

Now, with your browser, you can go to `/blog/write` to make your first post, which will be saved with a timestamp (for example as `/blog/5592ba9f/title-of-the-post`).
If you wish to edit a blog post, you must replace its title with `/edit` and got there (with my example you would end up with `/blog/5592ba9f/edit`).

## TODO

* Test the static redirects with a backup of the blog.
* Add more branding. There is none at the moment.
* Fix the search tool.

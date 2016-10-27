# [Getkey.eu](https://getkey.eu)

This is my personal website.

## Setup

Install [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.org/). Then `npm install` will take care of the others dependencies for you.

## Run it! 

```
$ node hook.js 3000
```

Then you can access it at `http://localhost:3000`.

You can also generate config files for Nginx and systemd with:

```
$ generate_config.sh
```

You will find them in `generated/`.

## How to post on the blog

First, you will need a password.
You can create one by running `node generate_hash.js`. You will be prompted for a password whose hash will be saved as `hash.txt`.

Now, with your browser, you can go to `/blog/write` to make your first post, which will be saved with a timestamp (for example as `/blog/5592ba9f`).
If you wish to edit your blog post, you can append `/edit` to its URL (with my example you'd end up with `/blog/5592ba9f/edit`).

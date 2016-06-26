# Getkey.eu

This is my personal website. The code is really old and very bad.

## Setup

Install [Node.js](https://nodejs.org/), [MongoDB](https://www.mongodb.org/) and [Pygments](http://pygments.org/). Then `npm install` will take care of the others dependencies for you.

## Run it! 

```
nodejs server.js
```

## How to post on the blog

First, you will need a password. You can create one by running `node generate_hash.js`. You will be prompted for a password whose hash will be saved as `hash.txt`.
Now, with your browser, you can go to `/blog/write` to make your first post, which will be saved with a timestamp under, for example `/blog/5592ba9f`. If you wish to edit your blog post, you can append `/edit` to its URL. In my example, you end up with `/blog/5592ba9f/edit`.

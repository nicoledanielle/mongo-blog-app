'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const {PORT, DATABASE_URL} = require('./config');
const {Post} = require('./models');

const app = express();

mongoose.Promise = global.Promise;

app.use(morgan('common'));
app.use(bodyParser.json());

app.get('/posts', (req, res) => {
  Post
    .find()
    .then(posts => res.json(
      posts.map(post => post.apiRepr())
    ))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Sorry, there was an error'});
    });
});

app.get('/posts/:id', (req, res) => {
  Post
    .findById(req.params.id)
    .then(post => res.json(post.apiRep()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Sorry, something went wrong'});
    });
});

app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message =  `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Post
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author
    })
    .then(
      post => res.status(201).json(post.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server error;'});
    });
});

app.put('/posts/:id', (req,res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  }

  const updated = {};
  const updateableFields = ['title', 'content', 'author'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  Post
    .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
    .then(updatedPost => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Error'}));
});

app.delete('/:id', (req, res) => {
  Post
    .findByIdAndRemove(req.params.id)
    .then(() => {
      console.log(`Deleted blog post id \`${req.params.ID}\``);
      res.status(204).end();
    });
});

app.use('*', function(req,res) {
  res.status(404).json(message: 'Not Found')};
});

let server;

function runServer() {
  const port = process.env.PORT || 8080;
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      mongoose.connect(DATABASE_URL);
      console.log(`Your app is listening on port ${port}`);
      resolve(server);
    }).on('error', err => {
      reject(err);
    });
  });
}

// // like `runServer`, this function also needs to return a promise.
// // `server.close` does not return a promise on its own, so we manually
// // create one.
function closeServer() {
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      mongoose.disconnect();
      if (err) {
        reject(err);
        // so we don't also call `resolve()`
        return;
      }
      resolve();
    });
  });
}

// // if server.js is called directly (aka, with `node server.js`), this block
// // runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};
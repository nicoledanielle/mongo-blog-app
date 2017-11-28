'use strict';

const mongoose = require('mongoose');

//this is our schema to represent a blog post
const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  content: {type: String, required: true},
  created: {type: Date, default: Date.now}
});

//virtuals
postSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();});

//instance methods
postSchema.methods.apiRepr = function () {
  
  return{
    id: this._id,
    title: this.title,
    author: this.authorName,
    content: this.content,
    created: this.created
  };
};

const Post = mongoose.model('Post', postSchema);

module.exports = {Post};
/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

let connection;

function connectToDb(){
  if(!connection){
    connection = MongoClient.connect(CONNECTION_STRING);
  }
  return connection;
}


module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res, next){
      const query = {};
      query.project = req.params.project;
      if(req.query)
      {
        const keys = Object.keys(req.query);
        keys.forEach(key => {
          if(key === 'open'){
            req.query[key] = (req.query[key] === 'true')
          }
          query[key] = req.query[key];
        })
      }
    console.log(query);
      connectToDb().then(client => {
        const db = client.db();
        console.log('connected to db');
        db.collection('issue').find(query).toArray((err, doc) => {
            console.log(doc);
            res.json(doc);
        });
      }).catch(next);
      
    })
    
    .post(function (req, res, next){
      console.log("Posting Issue ....");
      var project = req.params.project;
      const issue = {
        project: project,
        issue_title: req.body.issue_title,
        issue_text:  req.body.issue_text,
        created_by:  req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on:  new Date(),
        updated_on:  new Date(),
        open: true
      };
      if(!issue.issue_title || !issue.issue_text || !issue.created_by || !issue.project){
        return res.send("Missing Inputs");
      }
      console.log(issue);
      connectToDb().then( client => {
        const db = client.db();
        console.log('connected to db');
        db.collection('issue').insertOne(issue)
          .then(issue => {
            const { project , ...doc} = issue.ops[0];
            console.log(project,doc);
            res.json(doc);
          })
          .catch(err => { console.log(err); });
      }).catch(next);
    })
    
    .put(function (req, res){
      var project = req.params.project;
      if(!req.body){
        return res.send("no updated field sent");
      }
      const {_id, ...fields} = req.body;
      const updatedField = {};
      Object.keys(fields).forEach(field => {
        if(field === 'open'){
          fields[field] = (fields[field] === 'true');
        }
        if(fields[field] !== ''){
          updatedField[field] = fields[field];
        }
      });
      console.log(updatedField);
      connectToDb().then(client => {
        const db = client.db();
        db.collection('issue').findOneAndUpdate({_id: ObjectId(_id)}, {$set: {...updatedField, updated_on: new Date()}}, {upsert: true, returnNewDocument: true})
          .then(doc=>{
            console.log(doc);
            res.send("successfully updated");
        }).catch(err=>{
            res.send("could not update "+ _id);
        })
      }).catch(err=>{
          res.send("could not update "+ _id);
      })
      
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      console.log("delete...", project, req.body);
      if(!Object.prototype.hasOwnProperty.call(req.body, '_id'))
      {
        console.log("error occured");
        return res.send('_id error');  
      }
      
      connectToDb().then(client => {
        const db = client.db('issuetracker');
        console.log('connected to db');
        db.collection('issue').deleteOne({ _id: ObjectId(req.body._id), project: project })
          .then(() => { res.send("deleted " + req.body._id)})
          .catch(err => { throw new Error(err) });
      }).catch(() => { res.send("could not delete " + req.body._id)})
    });
    
};

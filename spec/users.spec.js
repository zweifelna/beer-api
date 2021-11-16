const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const { expect } = require('chai');
const { url_prefix, database_server, database_name } = require('../config.js');
const { cleanUpDatabase } = require('./utils');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');

function generateValidJwt(user) {
  // Generate a valid JWT which expires in 7 days.
  const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
  const claims = { sub: user._id.toString(), exp: exp };
  return new Promise((resolve, reject) => {
    jwt.sign(claims, config.secretKey, function(err, token) {
      if (err) {
        return reject(err);
      }

      resolve(token);
    });
  });
}

beforeEach(cleanUpDatabase);

//Check the ability to create a new user
describe('POST /user', function() {
    it('should create a user', async function() {
        const res = await supertest(app)
        .post(url_prefix + '/user')
        .send({
            username: 'JoDo',
            firstname: 'John',
            lastname: 'Doe',
            password: '123dsfdsfd4'
        })
        .expect(200)
        .expect('Content-Type', /json/);

        // Check that the response body is a JSON object with exactly the properties we expect.
        expect(res.body).to.be.an('object');
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.type).to.be.a('string');
        expect(res.body.data.id).to.be.a('string');
        expect(res.body.data.links).to.be.an('object');
        expect(res.body.data.links.self).to.equal('undefined/api/v1/user/' + res.body.data.id);
        expect(res.body.data.attributes).to.be.an('object');
        expect(res.body.data.attributes.username).to.equal('JoDo');
        expect(res.body.data.attributes.firstname).to.equal('John');
        expect(res.body.data.attributes.lastname).to.equal('Doe');
        expect(res.body).to.have.all.keys('data');
        expect(res.body.data).to.have.all.keys('type', 'id', 'links', 'attributes');
        expect(res.body.data.links).to.have.all.keys('self');
        expect(res.body.data.attributes).to.have.all.keys('username', 'firstname', 'lastname');

    });
});

//Check if we can list all the users
describe('GET /api/v1/user', function() {
    let user;
    beforeEach(async function() {
        // Create 2 people in the database before each test in this block.
        const users = await Promise.all([
          User.create({ username: 'JoDo', firstname: 'John', lastname: 'Doe', password: 'sad3kjlj'}),
          User.create({ username: 'JaDo', firstname: 'Jane', lastname: 'Doe', password: 'slkj33hjk2'})
        ]);
        user = users[0];
    });
    
    it('should retrieve the list of users', async function() {
        const token = await generateValidJwt(user);
        const res = await supertest(app)
        .get(url_prefix + '/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/);
        
        expect(res.body).to.be.an('object');
        expect(res.body.data).to.be.an('array');

        // Check that the first user is the correct one.
        expect(res.body.data[0].type).to.equal('user');
        expect(res.body.data[0].id).to.be.a('string');
        expect(res.body.data[0].links).to.be.an('object');
        expect(res.body.data[0].links.self).to.equal('undefined/api/v1/user/' + res.body.data[0].id);
        expect(res.body.data[0].attributes).to.be.an('object');
        expect(res.body.data[0].attributes.username).to.equal('JoDo');
        expect(res.body.data[0].attributes.firstname).to.equal('John');
        expect(res.body.data[0].attributes.lastname).to.equal('Doe');

        expect(res.body.data[0]).to.have.all.keys('type', 'id', 'links', 'attributes');
        expect(res.body.data[0].links).to.have.all.keys('self');
        expect(res.body.data[0].attributes).to.have.all.keys('username', 'firstname', 'lastname');

        // Check that the first user is the correct one.
        expect(res.body.data[1].type).to.equal('user');
        expect(res.body.data[1].id).to.be.a('string');
        expect(res.body.data[1].links).to.be.an('object');
        expect(res.body.data[1].links.self).to.equal('undefined/api/v1/user/' + res.body.data[1].id);
        expect(res.body.data[1].attributes).to.be.an('object');
        expect(res.body.data[1].attributes.username).to.equal('JaDo');
        expect(res.body.data[1].attributes.firstname).to.equal('Jane');
        expect(res.body.data[1].attributes.lastname).to.equal('Doe');

        
        expect(res.body.data[1]).to.have.all.keys('type', 'id', 'links', 'attributes');
        expect(res.body.data[0].links).to.have.all.keys('self');
        expect(res.body.data[1].attributes).to.have.all.keys('username', 'firstname', 'lastname');
        
        //Check the correct number of users in the response
        expect(res.body.data).to.have.lengthOf(2);
    });
});

//Check the ability to partially update a user
describe('PATCH /user/:id', function() {
    let user;
    beforeEach(async function() {
        // Create 2 people in the database before each test in this block.
        const newUser = await Promise.all([
          User.create({ username: 'JoDo', firstname: 'John', lastname: 'Doe', password: 'sad3kjlj'}),
        ]);
        user = newUser[0];
    });
    it('should update a user', async function() {
        const token = await generateValidJwt(user);
        const id = (await User.findOne({ username: 'JoDo'})).id
        const res = await supertest(app)
        .patch(url_prefix + '/user/' + id)
        .set('Authorization', `Bearer ${token}`)
        .send({
            username: 'DonJoe'
        })
        .expect(200)
        .expect('Content-Type', /json/);

        // Check that the response body is a JSON object with exactly the properties we expect.
        expect(res.body).to.be.an('object');
        expect(res.body.data).to.be.an('object');
        expect(res.body.data.type).to.be.a('string');
        expect(res.body.data.id).to.be.a('string');
        expect(res.body.data.links).to.be.an('object');
        expect(res.body.data.links.self).to.equal('undefined/api/v1/user/' + res.body.data.id);
        expect(res.body.data.attributes).to.be.an('object');
        expect(res.body.data.attributes.username).to.equal('DonJoe');
        expect(res.body.data.attributes.firstname).to.equal('John');
        expect(res.body.data.attributes.lastname).to.equal('Doe');
        expect(res.body).to.have.all.keys('data');
        expect(res.body.data).to.have.all.keys('type', 'id', 'links', 'attributes');
        expect(res.body.data.links).to.have.all.keys('self');
        expect(res.body.data.attributes).to.have.all.keys('username', 'firstname', 'lastname');

    });
});

//Check the ability to delete a user
describe('DELETE /user/:id', function() {
    let user;
    beforeEach(async function() {
        // Create a user before the tests
        const users = await Promise.all([
          User.create({ username: 'JoDo', firstname: 'John', lastname: 'Doe', password: 'sad3kjlj'}),
          User.create({ username: 'JaDo', firstname: 'Jane', lastname: 'Doe', password: 'slkj33hjk2'})
        ]);
        user = users[0];
    });
    it('should delete a user', async function() {
        const token = await generateValidJwt(user);
        const id = (await User.findOne({ username: 'JoDo'})).id
        const res = await supertest(app)
        .delete(url_prefix + '/user/' + id)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', 'text/plain; charset=utf-8');


        const list = await supertest(app)
        .get(url_prefix + '/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/);

        // Check that the response body is a JSON object with exactly the properties we expect.
        expect(list.body).to.be.an('object');
        expect(list.body.data).to.be.an('array');
        expect(list.body.data[0].type).to.equal('user');
        expect(list.body.data[0].id).to.be.a('string');
        expect(list.body.data[0].links).to.be.an('object');
        expect(list.body.data[0].links.self).to.equal('undefined/api/v1/user/' + list.body.data[0].id);

        expect(list.body.data[0].attributes).to.be.an('object');
        expect(list.body.data[0].attributes.username).to.equal('JaDo');
        expect(list.body.data[0].attributes.firstname).to.equal('Jane');
        expect(list.body.data[0].attributes.lastname).to.equal('Doe');

        expect(list.body).to.have.all.keys('data');
        expect(list.body.data[0]).to.have.all.keys('type', 'id', 'links', 'attributes');
        expect(list.body.data[0].links).to.have.all.keys('self');
        expect(list.body.data[0].attributes).to.have.all.keys('username', 'firstname', 'lastname');

        //Check that there are only one user anymore
        expect(list.body.data).to.have.lengthOf(1);
    });

});


after(mongoose.disconnect);

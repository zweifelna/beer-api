const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const { expect } = require('chai');
const { url_prefix, database_server, database_name } = require('../config.js');
const { cleanUpDatabase } = require('./utils');

beforeEach(cleanUpDatabase);
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
        expect(res.body.data.attributes).to.be.an('object');
        expect(res.body.data.attributes.username).to.equal('JoDo');
        expect(res.body.data.attributes.firstname).to.equal('John');
        expect(res.body.data.attributes.lastname).to.equal('Doe');
        expect(res.body).to.have.all.keys('data');
        expect(res.body.data).to.have.all.keys('type', 'id', 'attributes');
        expect(res.body.data.attributes).to.have.all.keys('username', 'firstname', 'lastname');

    });
});

describe('GET /api/v1/user', function() {
    it('should retrieve the list of users', async function() {
        const res = await supertest(app)
        .get(url_prefix + '/user')
        .expect(200)
        .expect('Content-Type', /json/);
        
        expect(res.body).to.be.an('object');
        expect(res.body.data).to.be.an('array');
        expect(res.body.data).to.have.lengthOf(0);
    });
});


after(mongoose.disconnect);

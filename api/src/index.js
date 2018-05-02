"use strict";
import 'source-map-support/register'
import nconf from 'nconf'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser';
import ObjectClient from './ObjectClient'

const config = nconf.argv()
   .env()
   .file({ file: 'config.json' })
   .get();

const clients = config.elasticsearch.clusters.map((c) => new ObjectClient(config.elasticsearch, c));

const clusterIdVerifier = function(req, res, next) {
    const id = req.params.id;
    if(id < 0 || id > clients.length) {
        return res.sendStatus(400);
    }
    next();
};

const jsonParser = bodyParser.json();
const app = express();

app.use(cors(config.cors));
app.get('/clusters', (req, res) => res.json(config.elasticsearch.clusters.map((h) => h.name)));

app.get('/clusters/:id', clusterIdVerifier, function(req, res) {
    clients[req.params.id].get().then((r) => {
        res.json({
            config: config.elasticsearch.clusters[req.params.id],
            parts: r,
        });
    }, function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get('/clusters/:id/parts', clusterIdVerifier, function(req, res) {
    clients[req.params.id].get().then((r) => res.json(r), function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.post('/clusters/:id/export', [clusterIdVerifier, jsonParser], function(req, res) {
    if(!req.body) {
        return res.sendStatus(400);
    }

    clients[req.params.id].exportObjects(req.body)
    .then(function(objs) {
        res.set('Content-disposition', 'attachment; filename=export.json');
        res.set('Content-type', "application/json");
        res.send(objs);
    }, err => {
        console.log(new Error(err));
        res.sendStatus(500);
    })
    .fail(e => console.log(e));
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

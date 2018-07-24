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

const clusterByName = function(req, res, next) {
    const idx = config.elasticsearch.clusters.findIndex(e => e.name === req.params.id);
    if(idx < 0) {
        return res.sendStatus(400);
    }
    if(idx >= clients.length) {
        return res.sendStatus(500);
    }
    req.clusterid = idx;
    req.cluster = clients[idx];
    return next();
};

const jsonParser = bodyParser.json();
const app = express();

app.use(cors(config.cors));
app.get('/clusters', (req, res) => res.json(config.elasticsearch.clusters.map((h) => h.name)));

app.get('/clusters/:id', clusterByName, function(req, res) {
    req.cluster.get().then((r) => {
        let cfg = Object.assign({}, config.elasticsearch.clusters[req.clusterid]);
        if(cfg.client) {
            delete cfg.client;
        }
        res.json({
            config: cfg,
            parts: r,
        });
    })
    .fail(function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.get('/clusters/:id/parts', clusterByName, function(req, res) {
    req.cluster.get().then((r) => res.json(r))
    .fail(function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.post('/clusters/:id/export', [clusterByName, jsonParser], function(req, res) {
    if(!req.body) {
        return res.sendStatus(400);
    }

    req.cluster.exportObjects(req.body)
    .then(function(objs) {
        res.set('Content-disposition', 'attachment; filename=export.json');
        res.set('Content-type', "application/json");
        res.send(objs);
    })
    .fail(function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

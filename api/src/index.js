"use strict";
import 'source-map-support/register'
import nconf from 'nconf'
import express from 'express'
import cors from 'cors'
import ObjectClient from './ObjectClient'

const config = nconf.argv()
   .env()
   .file({ file: 'config.json' })
   .get();

const clients = config.elasticsearch.clusters.map((c) => new ObjectClient(config.elasticsearch, c));

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
};

const app = express();
app.use(cors(corsOptions));
//app.options('*', cors())
app.get('/clusters', (req, res) => res.json(config.elasticsearch.clusters.map((h) => h.name)));

app.get('/clusters/:id', function(req, res) {
    const id = req.params.id;
    if(id < 0 || id > clients.length) {
        return res.sendStatus(400);
    }
    res.json(config.elasticsearch.clusters[id].name);
});

app.get('/clusters/:id/parts', function(req, res) {
    const id = req.params.id;
    if(id < 0 || id > clients.length) {
        return res.sendStatus(400);
    }
    clients[id].get().then((r) => res.json(r), function(err) {
        console.log(err);
        res.sendStatus(500);
    });
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

"use strict";
const nconf = require('nconf'),
    express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    ObjectClient = require('./ObjectClient'),
    TemplateCheck = require('./templateCheck'),
    MappingCheckScheduler = require('./MappingCheckScheduler'),
    log4js = require('log4js');

log4js.getLogger().level = 'debug';
const log = log4js.getLogger("index");

const config = nconf.argv()
   .env()
   .file({ file: 'config.json' })
   .get();

const clients = config.elasticsearch.clusters.map((c) => new ObjectClient(config.elasticsearch, c));
const templateCheck = TemplateCheck(clients);
const mappingCheck = new MappingCheckScheduler(config, clients);
mappingCheck.startScheduler();

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

const errorHandler = function(req, res, err) {
    log.error(`Failed to load data for cluster "${req.cluster.cluster.name}"`, err);
    res.sendStatus(500);
};

//app.use(cors(config.cors));
app.get('/clusters', function(req, res) {
    try {
        res.json(clients.map(e => {
            return {
                name: e.getName(),
                url: e.getUrl(),
                kibana: e.getKibanaUrl(),
                version: e.getLastKnownVersion()
            }
        }));
    } catch(err) {
        log.error("Failed to load cluster details.");
        res.sendStatus(500);
    }
});

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
    .fail(errorHandler.bind(undefined, req, res));
});

app.get('/clusters/:id/parts', clusterByName, function(req, res) {
    req.cluster.get().then((r) => res.json(r))
    .fail(errorHandler.bind(undefined, req, res));
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
    .fail(errorHandler.bind(undefined, req, res));
});

app.get('/templates', async function(req, res) {
    try {
        res.json(await templateCheck());
    } catch(ex) {
        errorHandler(req, res, ex);
    }
});

app.get('/mapping', async function(req, res) {
    try {
        res.json(await mappingCheck.get());
    } catch(ex) {
        errorHandler(req, res, ex);
    }
});

let port = process.env.PORT ? process.env.PORT : 8101;
app.listen(port, () => log.info(`Example app listening on port ${port}!`));

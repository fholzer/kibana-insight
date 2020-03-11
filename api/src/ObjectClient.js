const elasticsearch = require('elasticsearch');
    q = require('q'),
    TYPE = require('./ObjectTypes'),
    log = require('log4js').getLogger('ObjectClient');

const DEFAULT_MAXAGE = 1000 * 60 * 5;
const DASHBOARD_ALLOWED_CHILD_TYPES = [
    TYPE.VISUALIZATION,
    TYPE.SEARCH
];

module.exports = class ObjectClient {
    constructor(esConfig, cluster) {
        this.config = esConfig;
        this.cluster = cluster;
        var c = Object.assign({}, esConfig.client, cluster.client, { host: cluster.host })
        this.client = new elasticsearch.Client(c);
        this.cache = null;
    }

    getName() {
        return this.cluster.name;
    }

    getKibanaObjects(type) {
        return q.ninvoke(this.client, "search", {
            index: this.cluster.index || '.kibana',
            q: 'type:' + type,
            size: this.config.searchSize
        }).get(0).then(function(res) {
            log.debug("got " + res.hits.hits.length + " objects of type " + type);
            return res;
        });
    }

    kibanaObjectMapper(type, search) {
        if(search.hits.total > this.config.searchSize) {
            throw new Error("Didn't fetch all results! Total: " + search.hits.total);
        }
        return search.hits.hits.map((e) => ({
            id: e._id,
            type: type,
            title: e._source[type].title,
        }));
    }

    get() {
        var now = Date.now();
        if(this.cache !== null) {
            return this.cache.then((res) => {
                if(now - (this.cluster.maxage || this.config.maxage || DEFAULT_MAXAGE) < res.ts) {
                    return res;
                }

                return this.rebuildCache();
            });
        }

        return this.rebuildCache();
    }

    rebuildCache() {
        return this.cache = this.fetch().then((res) => ({
            ts: Date.now(),
            templates: res.templates,
            nodes: res.nodes,
            edges: res.edges
        }));
    }

    fetchTemplates() {
        return q.ninvoke(this.client.indices, "getTemplate", { name: "*" })
        .get(0).then((res) => {
            return {
                templates: res,
                templateList: Object.getOwnPropertyNames(res)
            };
        });
    }

    fetch() {
        log.info(`Fetching data for "${this.cluster.name}"`);
        return q.all([
            this.fetchTemplates(),
            this.getKibanaObjects(TYPE.INDEX_PATTERN),
            this.getKibanaObjects(TYPE.SEARCH),
            this.getKibanaObjects(TYPE.VISUALIZATION),
            this.getKibanaObjects(TYPE.DASHBOARD)])
        .spread((templates, indexPatterns, searches, visualizations, dashboards) => {
            var nodes = [].concat(
                this.kibanaObjectMapper(TYPE.INDEX_PATTERN, indexPatterns),
                this.kibanaObjectMapper(TYPE.SEARCH, searches),
                this.kibanaObjectMapper(TYPE.VISUALIZATION, visualizations),
                this.kibanaObjectMapper(TYPE.DASHBOARD, dashboards)
            );
            var edges = [];
            var addEdge = function(from, to) {
                edges.push({ source: from, target: to });
            };

            searches.hits.hits.forEach((s) => {
                var ip = [];
                if(!s._source.references) {
                    ip.push(TYPE.INDEX_PATTERN + ':' + JSON.parse(s._source.search.kibanaSavedObjectMeta.searchSourceJSON).index);
                } else {
                    for(let ref of s._source.references) {
                        ip.push(`${ref.type}:${ref.id}`);
                    }
                }
                ip.forEach(e => addEdge(s._id, e));
            });

            visualizations.hits.hits.forEach((v) => {
                if(v._source.visualization.savedSearchId) {
                    let sid = TYPE.SEARCH + ':' + v._source.visualization.savedSearchId;
                    addEdge(v._id, sid);
                }

                if(!v._source.references) {
                    var metaSource = v._source.visualization.kibanaSavedObjectMeta.searchSourceJSON;
                    if(metaSource) {
                        let meta = JSON.parse(metaSource);
                        if(meta.index) {
                            let ip = TYPE.INDEX_PATTERN + ':' + meta.index;
                            addEdge(v._id, ip);
                        }
                    }
                } else {
                    v._source.references.forEach(e => {
                        addEdge(v._id, `${e.type}:${e.id}`);
                    })
                }
            });

            dashboards.hits.hits.forEach((d) => {
                let refs;
                if(d._source.references) {
                    refs = d._source.references;
                } else {
                    if(d._source.dashboard.panelsJSON) {
                        refs = JSON.parse(d._source.dashboard.panelsJSON);
                    }
                }

                if(refs) {
                    refs.filter((v) => DASHBOARD_ALLOWED_CHILD_TYPES.indexOf(v.type) !== -1).forEach((c) => {
                        let cid = c.type + ':' + c.id;
                        addEdge(d._id, cid);
                    });
                }
            });

            // find objects with references to missing objects
            var missing = edges.filter((e) => nodes.findIndex((n) => n.id === e.target) === -1);
            if(missing.length > 0) {
                nodes.push({ id: TYPE.MISSING, type: TYPE.MISSING, title: "Missing" });
                missing.forEach((e) => {
                    e.target = TYPE.MISSING;
                });
            }

            log.debug("Got " + nodes.length + " nodes, " + edges.length + " edges");
            return {
                templates,
                nodes,
                edges
            };
        });
    }

    exportObjects(ids) {
        var docs = ids.map(i => ({ _id: i }));

        return q.ninvoke(this.client, "mget", {
            index: this.cluster.index || '.kibana',
            type: "doc",
            body: { docs }
        }).get(0).then(res => {
            let missing = res.docs.filter(d => d.found !== true);
            if(missing.length > 0) {
                log.error("Error while exporting objects. Some objects couldn't be found:", missing);
                throw new Error("Some objects couldn't be found!")
            }
            return res.docs.map(o => this.exportObjectMapper(o));
        });
    }

    exportObjectMapper = obj => {
        switch(obj._source.type) {
            case TYPE.DASHBOARD:
                return this.exportGenericMapper(obj);
            case TYPE.VISUALIZATION:
                return this.exportGenericMapper(obj);
            case TYPE.SEARCH:
                return this.exportGenericMapper(obj);
            default:
                throw new Error("Unknown object type: " + obj._source.type);
        }
    }

    exportGenericMapper(obj) {
        let s = obj._id.split(":");
        if(s.length !== 2) {
            throw new Error("Unsupported object _id");
        }

        return {
            _id: s[1],
            _type: s[0],
            _source: obj._source[obj._source.type]
        };
    }
}

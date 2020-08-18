const log = require('log4js').getLogger("MappingCheckScheduler"),
    MappingCheck = require('./MappingCheck'),
    esb = require('elastic-builder');

module.exports = class MappingCheckScheduler {
    constructor(config, clusters) {
        this.config = config;
        this.clusters = clusters;
    }

    async check() {
        let res = [];
        for(let cluster of this.clusters) {
            try {
                res.push({
                    name: cluster.getName(),
                    result: this.transformResult(await this.checkCluster(cluster))
                });
            } catch(ex) {
                log.error(`Error while checking ${cluster.getName()}`, ex);
            }
        }
        return res;
    }

    transformResult(clusterResult) {
        for(let pattern of clusterResult) {
            if(!(pattern.result instanceof Map)) {
                log.debug(`result for pattern ${pattern.pattern} isn't a Map`, pattern);
                continue;
            }
            let fieldObj = {};
            for(let field of pattern.result.keys()) {
                let fieldData = pattern.result.get(field);
                let typeObj = {};
                for(let type of fieldData.keys()) {
                    typeObj[type] = [...fieldData.get(type)];
                }
                fieldObj[field] = typeObj;
            }
            pattern.result = fieldObj;
        }

        return clusterResult;
    }

    startScheduler() {
        this.cache = this.updateCache();
        setInterval(this.updateCache.bind(this), 60 * 60 * 1000);
    }

    async updateCache() {
        let res = this.check();
        try {
            await res;
        } finally {
            this.cache = res;
        }
    }

    get() {
        if(!this.cache) {
            this.startScheduler();
        }
        return this.cache;
    }

    async checkCluster(cluster) {
        let res = [];
        let client = await cluster.getClient();
        // get index patterns to check from command line args
        let indexPatternsToCheck = new Set(this.config._);

        // if no command line args given, then fetch and check all from .kibana index
        if(indexPatternsToCheck.size < 1) {
            indexPatternsToCheck = await this.getIndexPatterns(client);
        }

        for(let p of [...indexPatternsToCheck]) {
            res.push({
                pattern: p,
                result: await this.checkIndexPattern(client, p)
            });
        }
        return res;
    }

    async checkIndexPattern(client, indexPattern) {
        let mappings;

        try {
            mappings = await client.indices.getMapping({
                index: indexPattern,
                includeTypeName: false
            });
        } catch(ex) {
            if(ex.status === 404) {
                return ex.displayName;
            }
            log.error(`An error occurred while fetching mappings for index pattern ${indexPattern}`, ex);
            throw ex;
        }

        let checker = new MappingCheck(mappings);
        return checker.check();
    }

    async getIndexPatterns(client) {
        let body = esb.requestBodySearch()
            .query(
                esb.boolQuery()
                    .filter(esb.termQuery('type', 'index-pattern'))
            )
            .size(1000)
            .source("index-pattern.title");

        let res = await client.search({
            index: ".kibana",
            body
        });

        return new Set(res.hits.hits.map(e => e._source["index-pattern"].title));
    }
}

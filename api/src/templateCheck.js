const crypto = require('crypto'),
    log = require('log4js').getLogger("templateCheck");

module.exports = function(clients) {
    var data;

    const templateMapper = function(obj) {
        if(!obj.mappings) {
            return "0".repeat(64);
        }

        var ser = JSON.stringify(objectSorter(obj.mappings));
        var shasum = crypto.createHash('sha256');

        shasum.update(ser);
        return shasum.digest("hex");
    };

    const objectSorter = function(obj) {
        if(!(obj instanceof Object)) {
            return obj;
        } else if(obj instanceof String) {
            return obj;
        } else if(Array.isArray(obj)) {
            return obj.slice().sort();
        }

        return Object.keys(obj)
            .sort()
            .reduce(function(acc, key) {
                acc[key] = objectSorter(obj[key]);
                return acc;
            }, {});
    }

    const clusterMapper = async function(client) {
        try {
            let cache = await client.get();
            let t = cache.templates;
            var hashes = {};
            for(let n of Object.getOwnPropertyNames(t.templates)) {
                hashes[n] = templateMapper(t.templates[n]);
            }
            return {
                name: client.getName(),
                templates: hashes,
                templateList: t.templateList
            };
        } catch(e) {
            log.error(`Failed to fetch or process templates for cluster "${client.cluster.name}"`, e);
            return null;
        }
    };

    const loadData = async function() {
        let clusters = [];
        for(let client of clients) {
            clusters.push(await clusterMapper(client));
        }

        var allTemplates = [].concat.apply([], clusters.filter(c => c !== null).map(c => c.templateList));
        allTemplates = allTemplates.sort().filter((el, i, a) => i === a.indexOf(el) && el.length > 0);
        return {
            allTemplates,
            clusters
        };
    };

    const updateData = function() {
        data = Promise.resolve(loadData());
    };
    data = Promise.resolve(loadData());
    setInterval(updateData, 60 * 60 * 1000);
    return () => data;
};

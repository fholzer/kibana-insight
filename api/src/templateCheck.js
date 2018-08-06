const qmap = require('./qmap'),
    crypto = require('crypto');

module.exports = function(clients) {
    var data;

    const templateMapper = function(obj) {
        if(!obj.mappings) return "0".repeat(64);
        var ser = JSON.stringify(obj.mappings);
        var shasum = crypto.createHash('sha256');
        shasum.update(ser);
        return shasum.digest("hex");
    };

    const clusterMapper = function(client) {
        return client.get()
            .get("templates")
            .then(t => {
                var hashes = {};
                for(let n of Object.getOwnPropertyNames(t.templates)) {
                    hashes[n] = templateMapper(t.templates[n]);
                }
                return {
                    name: client.getName(),
                    templates: hashes,
                    templateList: t.templateList
                };
            });
    };

    const loadData = function() {
        return qmap(2, clients, clusterMapper)
        .then(function(clusters) {
            var allTemplates = [].concat.apply([], clusters.map(c => c.templateList));
            allTemplates = allTemplates.sort().filter((el, i, a) => i === a.indexOf(el) && el.length > 0);
            return {
                allTemplates,
                clusters
            };
        });
    };

    const updateData = function() {
        data = loadData();
    };
    data = loadData();
    data.done();
    setInterval(updateData, 60 * 60 * 1000);

    return () => data;
};

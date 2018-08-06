const qmap = require('./qmap'),
    crypto = require('crypto');

module.exports = function(clients) {
    var data;

    const templateMapper = function(obj) {
        if(!obj.mappings) return "0000";
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

            console.log("template," + clusters.map(c => c.name).join(","));
            for(let t of allTemplates) {
                var line = [t].concat(clusters.map(c => c.templates.hasOwnProperty(t) ? "Y" : "N"));
                console.log(line.join(","));
            }
            console.log();
            console.log("template," + clusters.map(c => c.name).join(","));
            for(let t of allTemplates) {
                var line = [t].concat(clusters.map(c => c.templates.hasOwnProperty(t) ? hashMapping(c.templates[t]) : ""));
                console.log(line.join(","));
            }
        });
    };

    const updateData = function() {
        data = loadData();
    };
    data = loadData();
    data.done();
    setInterval(updateData, 60 * 60 * 1000);

    return () => data;
}

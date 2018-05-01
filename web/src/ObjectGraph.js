import Graph from 'graph.js/dist/graph.full.js';
import TYPE from './ObjectTypes';

export default class ObjectGraph {
    cachedParts = null;
    cachedStats = null;

    static fromParts(parts) {
        return new ObjectGraph(new Graph(
            ...parts.nodes.map((n) => [n.id, n]),
            ...parts.edges.map((e) => [[e.source, e.target], e])
        ));
    }

    constructor(graph) {
        this.graph = graph;
    }

    clone() {
        return new ObjectGraph(this.graph);
    }

    filterForSink(sinkId) {
        var res = new Graph();

        if(!this.graph.hasVertex(sinkId)) {
            return new ObjectGraph(res);
        }

        for(let [key, value] of this.graph.verticesWithPathTo(sinkId)) {
            res.ensureVertex(key, value);
        }
        res.ensureVertex(sinkId, this.graph.vertexValue(sinkId));

        for(let [key, ] of this.graph.verticesWithPathTo(sinkId)) {
            for (let [from, , edgeValue] of this.graph.verticesTo(key)) {
                res.ensureEdge(from, key, edgeValue);
            }
        }
        for(let [from, , edgeValue] of this.graph.verticesTo(sinkId)) {
            res.ensureEdge(from, sinkId, edgeValue);
        }

        return new ObjectGraph(res);
    }

    filterForSource(sourceId) {
        var res = new Graph();

        if(!this.graph.hasVertex(sourceId)) {
            return new ObjectGraph(res);
        }

        for(let [key, value] of this.graph.verticesWithPathFrom(sourceId)) {
            res.ensureVertex(key, value);
        }
        res.ensureVertex(sourceId, this.graph.vertexValue(sourceId));

        for(let [key, ] of this.graph.verticesWithPathFrom(sourceId)) {
            for (let [to, , edgeValue] of this.graph.verticesFrom(key)) {
                res.ensureEdge(key, to, edgeValue);
            }
        }
        for(let [to, , edgeValue] of this.graph.verticesFrom(sourceId)) {
            res.ensureEdge(sourceId, to, edgeValue);
        }

        return new ObjectGraph(res);
    }

    removeOrphanedNodes() {
        return new ObjectGraph(this.calculateOrphanedNodes()[0]);
    }

    filterForOrphanedNodes() {
        return new ObjectGraph(this.calculateOrphanedNodes()[1]);
    }

    calculateOrphanedNodes() {
        var res = this.graph.clone(),
            removed = new Graph(),
            changed;
        do {
            changed = false;
            for(let [id, n] of res.sources()) {
                if(n.type === TYPE.DASHBOARD) {
                    continue;
                }
                removed.ensureVertex(id, this.graph.vertexValue(id));
                res.destroyVertex(id);
                changed = true;
            }
        } while(changed);
        for(let [from, to, e] of this.graph.edges()) {
            if(removed.hasVertex(from) && removed.hasVertex(to)) {
                removed.ensureEdge(from, to, e)
            }
        }
        return [res, removed];
    }

    calculateStats() {
        if(this.cachedStats !== null) {
            return this.cachedStats;
        }

        const TYPE_TRANSLATION = {
            "dashboard": "Dashboards",
            "visualization": "Visualizations",
            "search": "Searches",
            "index-pattern": "Index Patterns",
        }
        const parts = this.toD3();

        const stats = [
            TYPE.DASHBOARD,
            TYPE.VISUALIZATION,
            TYPE.SEARCH,
            TYPE.INDEX_PATTERN
        ].map((t) => ({
            key: t,
            label: TYPE_TRANSLATION[t],
            value: parts.nodes.filter((n) => n.type === t).length
        }));

        stats.push({
            key: TYPE.MISSING,
            label: "Broken References",
            value: parts.edges.filter((e) => e.target === TYPE.MISSING).length
        });

        return this.cachedStats = stats;
    }

    hasVertex(id) {
        return this.graph.hasVertex(id);
    }

    hasEdge(from, to) {
        return this.graph.hasEdge(from, to);
    }

    toD3() {
        if(this.cachedParts !== null) {
            return this.cachedParts;
        }

        var nodes = [],
            edges = [];

        for (let [, value] of this.graph.vertices()) {
            nodes.push(value);
        }
        for (let [from, to, ] of this.graph.edges()) {
            edges.push({ source: from, target: to, weight: 1});
        }
        return this.cachedParts = { nodes: nodes, edges: edges };
    }
}

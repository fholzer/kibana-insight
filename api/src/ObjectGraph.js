import Graph from 'graph.js/dist/graph.full.js';
import TYPE from './ObjectTypes';

export default class ObjectGraph {
    cache = null;

    constructor(graph) {
        this.graph = graph;
    }

    clone() {
        return new ObjectGraph(this.graph);
    }

    filterForSink(sinkId) {
        var res = new Graph();
        var vertices = [];

        for(let [key, value] of this.graph.verticesWithPathTo(sinkId)) {
            res.ensureVertex(key, value);
        }
        res.ensureVertex(sinkId, this.graph.vertexValue(sinkId));

        for(let [key, value] of this.graph.verticesWithPathTo(sinkId)) {
            for (let [from, vertexValue, edgeValue] of this.graph.verticesTo(key)) {
                res.ensureEdge(from, key, edgeValue);
            }
        }
        for(let [from, vertexValue, edgeValue] of this.graph.verticesTo(sinkId)) {
            res.ensureEdge(from, sinkId, edgeValue);
        }

        return new ObjectGraph(res);
    }

    filterForSource(sourceId) {
        var res = new Graph();
        var vertices = [];

        for(let [key, value] of this.graph.verticesWithPathFrom(sourceId)) {
            res.ensureVertex(key, value);
        }
        res.ensureVertex(sourceId, this.graph.vertexValue(sourceId));

        for(let [key, value] of this.graph.verticesWithPathFrom(sourceId)) {
            for (let [from, vertexValue, edgeValue] of this.graph.verticesFrom(key)) {
                res.ensureEdge(from, key, edgeValue);
            }
        }
        for(let [from, vertexValue, edgeValue] of this.graph.verticesFrom(sourceId)) {
            res.ensureEdge(from, sourceId, edgeValue);
        }

        return new ObjectGraph(res);
    }

    removeOrphanedNodes() {
        var res = this.graph.clone(),
            removed = new Graph(),
            changed,
            toRemove = { nodes: [], nodeIds: [], edges: [] };
        do {
            changed = false;
            for(let [id, n] of res.sources()) {
                if(n.type === TYPE.DASHBOARD) {
                    continue;
                }
                toRemove.nodes.push(n);
                toRemove.nodeIds.push(id);
                removed.ensureVertex(id, graph.vertexValue(id));
                res.destroyVertex(id);
                changed = true;
            }
        } while(changed);
        for(let [from, to, e] of this.graph.edges()) {
            if(removed.hasVertex(from) && removed.hasVertex(to)) {
                removed.ensureEdge(from, to, e)
            }
        }
        return res;
    }

    toD3() {
        if(this.cache !== null) {
            return this.cache;
        }

        var nodes = [],
            edges = [];

        for (let [key, value] of graph.vertices()) {
            nodes.push(value);
        }
        for (let [from, to, value] of graph.edges()) {
            edges.push({ source: from, target: to, weight: 1});
        }
        return this.cache = { nodes: nodes, edges: edges };
    }
}

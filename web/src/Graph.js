import React, { Component } from 'react'
import * as d3 from "d3"

export default class Graph extends Component {
    state = {
        cluster: null
    }
    focus_node = null;
    highlight_trans = 0.2;

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.cluster !== prevState.cluster) {
            return { cluster: nextProps.cluster, resetForce: true };
        }
        return null;
    }

    componentDidMount() {
        const rootNode = this.rootnode;

        var width = this.props.width,
            height = this.props.height;

        var svg = this.svg = d3.select(rootNode);

        // needed to offset the simulation's center
        var wrapper = svg.append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // needed for applying zoom and pan
        this.container = wrapper.append("g")
            .attr("class", "everything")

        // Zoom functions
        var zoom_actions = () => {
            this.container.attr("transform", d3.event.transform);
        }

        // add zoom capabilities
        var zoom = d3.zoom()
        .on("zoom", zoom_actions);

        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.scale(.5));

        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(100))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter())
            .force("collision", d3.forceCollide(16));
    }

    componentWillUnmount() {
        this.svg.on(".zoom", null);
        this.svg.selectAll().remove();
    }

    componentDidUpdate() {
        console.log("componentDidUpdate")
        this.createGraph()
    }

    createGraph() {
        if(!this.state.cluster || this.state.cluster === true) {
            return;
        }

        var graph = this.state.cluster.parts;

        console.log("createGraph graph.nodes.length: " + graph.nodes.length);
        console.log("createGraph graph.edges.length: " + graph.edges.length);

        var links = this.container.append("g")
                .attr("class", "links")
            .selectAll("line")
            .data(graph.edges);

        links.exit().remove();

        this.links = links = links.enter().append("line")
                .attr("stroke-width", 1)
            .merge(links);

        var nodes = this.container.append("g")
                .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes);

        nodes.exit().remove();

        var nodesenter = nodes.enter().append("g")
                .attr("class", "node")
                .call(d3.drag()
                    .on("start", this.dragstarted)
                    .on("drag", this.dragged)
                    .on("end", this.dragended));

        nodesenter.append("image")
            .attr("xlink:href", (d) => process.env.PUBLIC_URL + "/img/" + d.type + ".svg")
            .attr("x", -8)
            .attr("y", -8)
            .attr("width", 16)
            .attr("height", 16)
            .attr("class", "icon svg");

        nodesenter.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) { return d.title });

        nodesenter.append("title")
            .text(function(d) { return d.id; })

        nodesenter.on("mouseover", (d) => {
                if(this.focus_node === null) {
                    this.set_highlight(d, this.directLinkNodeFilter, this.directLinkLinkFilter);
                }
            })
            .on("mouseout", (d) => {
                if(this.focus_node === null) {
                    this.exit_highlight();
                }
            });

        this.nodes = nodes = nodesenter.merge(nodes);

        d3.select(window).on("mouseup", () => {
            this.focus_node = null;
            this.exit_highlight();
        });

        console.log(graph.nodes, graph.edges);

        this.simulation
            .nodes(graph.nodes)
            .on("tick", this.ticked);

        this.simulation.force("link")
            .links(graph.edges);

        if(this.state.resetForce) {
            console.log("restart simulation")
            this.simulation.alphaTarget(0.8).restart();
            this.setState({ resetForce: false });
        }
    }

    ticked() {
        this.links
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        this.nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    dragstarted = (d) => {
        this.focus_node = d;
        if (!d3.event.active) {
            this.simulation.alphaTarget(0.1).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged = (d) => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    dragended = (d) => {
        this.focus_node = null;
        if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }


    exit_highlight = () => {
        this.svg.style("cursor","move");

        this.nodes.select("image").style("opacity", null);
        this.nodes.select("text").style("opacity", null);
        this.links.style("stroke-opacity", null);
    }

    directLinkNodeFilter(n1, n2) {
        return n1 === n2 || this.state.cluster.graph.hasEdge(n1.id, n2.id) || this.state.cluster.graph.hasEdge(n1.id, n2.id);
    }

    directLinkLinkFilter(n1, n2) {
        return n2.source.index === n1.index || n2.target.index === n1.index;
    }

    set_highlight = (d, nodeFilter, edgeFilter) => {
        this.svg.style("cursor","pointer");
        var highlight_trans = this.highlight_trans;

        this.nodes.select("image").style("opacity", (o) => {
            return this.directLinkNodeFilter(d, o) ? null : highlight_trans;
        });
        this.nodes.select("text").style("opacity", (o) => {
            return this.directLinkNodeFilter(d, o) ? null : highlight_trans;
        });
        this.links.style("stroke-opacity", (o) => {
            return this.directLinkLinkFilter(d, o) ? null : highlight_trans;
        });
    }
    render() {
        console.log("render")
        return <svg ref={node => this.rootnode = node}
        width={this.props.width} height={this.props.height}>
        </svg>
    }
}

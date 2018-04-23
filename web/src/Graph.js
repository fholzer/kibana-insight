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
            return { cluster: nextProps.cluster };
        }
        return null;
    }

    componentDidMount() {
        const rootNode = this.node

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

        var link = this.container.append("g")
                .attr("class", "links")
            .selectAll("line")
            .data(graph.edges)
            .enter().append("line")
                .attr("stroke-width", 1);

        var node = this.container.append("g")
                .attr("class", "nodes")
            .selectAll(".node")
            .data(graph.nodes)
            .enter().append("g")
                .attr("class", "node")
                .call(d3.drag()
                    .on("start", this.dragstarted)
                    .on("drag", this.dragged)
                    .on("end", this.dragended));

            node.append("image")
                .attr("xlink:href", (d) => process.env.PUBLIC_URL + "/img/" + d.type + ".svg")
                .attr("x", -8)
                .attr("y", -8)
                .attr("width", 16)
                .attr("height", 16)
                .attr("class", "icon svg");

            node.append("text")
                .attr("dx", 12)
                .attr("dy", ".35em")
                .text(function(d) { return d.title });

            node.append("title")
                .text(function(d) { return d.id; })

        node.on("mouseover", (d) => {
                    if(this.focus_node === null) {
                    this.set_highlight(node, link, d, this.directLinkNodeFilter, this.directLinkLinkFilter);
                }
            })
            .on("mouseout", (d) => {
                if(this.focus_node === null) {
                    this.exit_highlight(node, link);
                }
            });

        node.exit().remove();
        link.exit().remove();

        d3.select(window).on("mouseup", () => {
            this.focus_node = null;
            this.exit_highlight(node, link);
        });

        console.log(graph.nodes, graph.edges);

        this.simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        this.simulation.force("link")
            .links(graph.edges);

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        }
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


    exit_highlight = (node, link) => {
        this.svg.style("cursor","move");

        node.select("image").style("opacity", null);
        node.select("text").style("opacity", null);
        link.style("stroke-opacity", null);
    }

    directLinkNodeFilter(n1, n2) {
        return n1 === n2 || this.state.cluster.graph.hasEdge(n1.id, n2.id) || this.state.cluster.graph.hasEdge(n1.id, n2.id);
    }

    directLinkLinkFilter(n1, n2) {
        return n2.source.index === n1.index || n2.target.index === n1.index;
    }

    set_highlight = (node, link, d, nodeFilter, edgeFilter) => {
        this.svg.style("cursor","pointer");
        var highlight_trans = this.highlight_trans;

        node.select("image").style("opacity", (o) => {
            return this.directLinkNodeFilter(d, o) ? null : highlight_trans;
        });
        node.select("text").style("opacity", (o) => {
            return this.directLinkNodeFilter(d, o) ? null : highlight_trans;
        });
        link.style("stroke-opacity", (o) => {
            return this.directLinkLinkFilter(d, o) ? null : highlight_trans;
        });
    }
    render() {
        console.log("render")
        return <svg ref={node => this.node = node}
        width={this.props.width} height={this.props.height}>
        </svg>
    }
}

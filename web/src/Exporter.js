import React, { Component } from 'react';
import { Container, Grid, Segment, Divider, Form, Dropdown, Checkbox, Button } from 'semantic-ui-react';
import fileSaver from 'file-saver';
import Config from './Config';
import Graph from './Graph';
import ObjectGraph from './ObjectGraph';
import ObjectList from './ObjectList';
import GraphStats from './GraphStats';
import TYPE from './ObjectTypes';

const TYPES_EXPORTABLE = [TYPE.DASHBOARD, TYPE.VISUALIZATION, TYPE.SEARCH];

const FILTER_TYPE_LIST = [
    {
        id: "none",
        title: "No Filter",
        useEntity: false
    },
    {
        id: "dashboard",
        title: "Dashboards",
        useEntity: true
    },
    {
        id: "visualization",
        title: "Visualizations",
        useEntity: true
    },
    {
        id: "search",
        title: "Searches",
        useEntity: true
    },
    {
        id: "index-pattern",
        title: "Index Patterns",
        useEntity: true
    },
    {
        id: "orphaned",
        title: "Orphaned Objects",
        useEntity: false
    },
    {
        id: "missing",
        title: "Broken References",
        useEntity: false
    }
];


export default class Exporter extends Component {
    state = {
        cluster: null,
        filterType: "none",
        selectWithDeps: true
    }

    componentDidMount() {
        this.updateClusterState();
        this.updateFilterState();
    }

    componentDidUpdate(prevProps) {
        if(this.props.cluster !== prevProps.cluster) {
            this.updateClusterState();
        }
        if(this.props.match !== prevProps.match) {
            this.updateFilterState();
        }
    }

    updateClusterState() {
        const cluster = this.props.cluster;

        let selectedGraph, exportable;
        if(cluster && cluster.parts && cluster.parts.nodes) {
            exportable = cluster.parts.nodes
                .filter(n => TYPES_EXPORTABLE.indexOf(n.type) !== -1)
                .sort(Exporter.objectTypeTitleComparator)
                .map((n) => ({ key: n.id, text: n.title, value: n.id, image: process.env.PUBLIC_URL + "/img/" + n.type + ".svg" }));
        }
        if(cluster && cluster.graph) {
            selectedGraph = cluster.graph
        }

        var next = {
            cluster,
            selectedGraph,
            stagedGraph: ObjectGraph.empty(),
            exportable
        };
        //next.filteredGraph = Browser.generateFilteredGraph(Object.assign({}, this.state, next));
        this.setState(next);
    }

    updateFilterState() {
        var filterType,
            filterEntity;

        const match = this.props.match
        if(match && match.params && match.params.filter) {
            let p = match.params.filter.indexOf(":");
            if(p < 0) {
                filterType = match.params.filter;
            } else {
                filterType = match.params.filter.substring(0, p);
                filterEntity = match.params.filter;
            }
        }

        let types = FILTER_TYPE_LIST.filter(e => e.id === filterType);
        if(types.length < 1) {
            console.log("setting default filter")
            let target = "/" + this.props.match.params.cluster
                + "/exporter/none";
            this.props.history.push(target);
            return
        }

        this.setState({
            filterType,
            filterEntity
        });
        this.updateFilteredGraph();
        this.updateSelectGraph();
    }

    static objectTypeTitleComparator(o1, o2) {
        var res = Exporter.objectTypeComparator(o1, o2);
        if(res === 0) {
            return o1.title.localeCompare(o2.title);
        }
        return res;
    }

    static objectTypeComparator(o1, o2) {
        return TYPES_EXPORTABLE.indexOf(o2.type) - TYPES_EXPORTABLE.indexOf(o1.type)
    }

    static exportNodeFilter(key, value) {
        return TYPES_EXPORTABLE.indexOf(value.type) !== -1;
    }

    onWithDepsChanged = (e, { checked }) => {
        this.setState({ selectWithDeps: checked });
        this.updateSelectGraph();
    }

    onAddSelectionClick = () => {
        this.setState(prev => {
            if(!prev.filterEntity) {
                return null;
            }

            var additional = prev.selectWithDeps ?
                prev.cluster.graph.filterForRelated(prev.filterEntity) :
                prev.cluster.graph.filterForNode(prev.filterEntity);
            additional = additional.filterNodes(Exporter.exportNodeFilter);

            return {
                stagedGraph: prev.stagedGraph.merge(additional)
            }
        });
    }

    onDownloadClick = () => {
        var ids = this.state.stagedGraph.toD3().nodes.map(n => n.id);
        fetch(Config.apiBaseUrl + '/clusters/' + this.state.cluster.clusterId + '/export', {
            body: JSON.stringify(ids),
            headers: {
                'content-type': 'application/json'
            },
            method: "POST"
        })
        .then(res => res.blob())
        .then(res => {
            fileSaver.saveAs(res, "export.json", true);
        })
        .catch(err => console.log(err));
    }

    updateSelectGraph() {
        this.setState(prev => {
            if(!prev.filterEntity || !prev.cluster.graph) {
                return null;
            }

            var g = prev.selectWithDeps ?
                prev.cluster.graph.filterForRelated(prev.filterEntity) :
                prev.cluster.graph.filterForNode(prev.filterEntity);
            g = g.filterNodes(Exporter.exportNodeFilter);

            return {
                selectedGraph: g
            }
        });
    }

    static generateFilteredGraph(state) {
        if(typeof state.cluster !== "object") {
            return;
        }
        var graph = state.cluster.graph,
            filterType = state.filterType,
            filterEntity = state.filterEntity;

        switch(filterType) {
            case "none":
                return graph;
            case "missing":
                return graph.filterForSink("missing");
            case "orphaned":
                return graph.filterForOrphanedNodes();
            default:
                return graph.filterForRelated(filterEntity);
        }

    }

    updateFilteredGraph() {
        if(this.state.cluster === null) {
            return;
        }

        this.setState(prev => ({
            filteredGraph: Exporter.generateFilteredGraph(prev)
        }));
    }

    getFilterEntityProps() {
        let match = FILTER_TYPE_LIST.filter(e => e.id === this.state.filterType);
        if(match.length > 0) {
            if(match[0].useEntity) {
                return {};
            }
        }
        return { disabled: true };
    }

    getFilterEntityOptions() {
        return this.state.cluster.graph.toD3().nodes
            .filter((n) => this.state.filterType === n.type)
            .sort(Exporter.objectTitleComparator)
            .map((n) => ({ key: n.id, text: n.title, value: n.id }));
    }

    onFilterTypeChange = (e, { value }) => {
        if(this.state.filterType === value) {
            return;
        }

        let match = FILTER_TYPE_LIST.filter(e => e.id === value);
        match = match[0];

        let target = "/" + this.props.match.params.cluster
            + "/exporter/" + match.id;
        this.props.history.push(target);
    }

    onFilterEntityChange = (e, { value }) => {
        if(this.state.filterEntity === value) {
            return;
        }

        let target = "/" + this.props.match.params.cluster
            + "/exporter/" + value;
        this.props.history.push(target);
    }

    render() {
        if(this.state.cluster === null || this.state.cluster === true) {
            return null;
        }

        const filterTypeOptions = FILTER_TYPE_LIST.map(e => ({ key: e.id, text: e.title, value: e.id }));
        const filterEntityProps = this.getFilterEntityProps();
        const filterEntityOptions = this.getFilterEntityOptions();

        return (
            <Container fluid>
                <Segment>
                    <Grid columns="equal">
                        <Grid.Column width={8}>
                            <Segment>
                                <Graph graph={this.state.selectedGraph} style={{border: "1px solid black"}} height="300px"/>
                            </Segment>
                            <Form>
                                <Form.Field>
                                    <label>Filter Type</label>
                                    <Dropdown
                                        selection
                                        search
                                        options={filterTypeOptions}
                                        value={this.state.filterType}
                                        onChange={this.onFilterTypeChange} />
                                </Form.Field>
                                <Form.Field>
                                    <label>Filter Entity</label>
                                    <Dropdown
                                        selection
                                        search
                                         {...filterEntityProps}
                                        options={filterEntityOptions}
                                        value={this.state.filterEntity}
                                        onChange={this.onFilterEntityChange} />
                                </Form.Field>
                                <Form.Field>
                                    <Checkbox checked={this.state.selectWithDeps} onChange={this.onWithDepsChanged} label="Include Dependencies" />
                                </Form.Field>
                                <Form.Field>
                                    <p>Please note that only dashboards, visualizations and searches are exportable.</p>
                                </Form.Field>
                                <Form.Field>
                                    <Button
                                        floated="right"
                                        style={{ marginBottom: "1em" }}
                                        onClick={this.onAddSelectionClick}
                                        disabled={!this.state.filterEntity}>Add Selection</Button>
                                </Form.Field>
                            </Form>
                            <Divider clearing />
                            <ObjectList cluster={this.state.cluster} graph={this.state.selectedGraph} />
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Segment textAlign="center" basic><GraphStats graph={this.state.stagedGraph} size="mini" /></Segment>
                            <Divider/>
                            <Graph graph={this.state.stagedGraph} style={{border: "1px solid black"}} height="400px" />
                            <Divider/>
                            <Button
                                floated="right"
                                style={{ marginBottom: "1em" }}
                                onClick={this.onDownloadClick}>Download</Button>
                            <Divider clearing/>
                            <ObjectList cluster={this.state.cluster} graph={this.state.stagedGraph} />
                        </Grid.Column>
                    </Grid>
                </Segment>
            </Container>
        );
    }
}

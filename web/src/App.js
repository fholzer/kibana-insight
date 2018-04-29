import React, { Component } from 'react';
import './App.css';
import { Menu, Container, Grid, Segment } from 'semantic-ui-react';
import Graph from './Graph';
import ClusterSelector from './ClusterSelector';
import FilterSelector from './FilterSelector';
import ClusterDetails from './ClusterDetails';
import ObjectGraph from './ObjectGraph';
import TYPE from './ObjectTypes';

const FILTER_DASHBOARD = [TYPE.DASHBOARD];
const FILTER_INDEX = [TYPE.INDEX_PATTERN, TYPE.MISSING];

class App extends Component {
    state = {
        clusterId: null,
        clusterDetails: null
    }

    onClusterSelect = (id, name) => {
        this.setState({
            clusterId: id,
            clusterDetails: true
        });
        this.loadParts(id);
    }

    loadParts(clusterId) {
        fetch('http://127.0.0.1:3001/clusters/' + clusterId + '/parts')
        .then((res) => {
            if(!res.ok) {
                console.log(res);
                this.setState({ clusterDetails: false, clusterId: false });
            }
            return res.json();
        })
        .then((json) => this.processParts(clusterId, json))
        .catch((err) => {
            console.log(err);
            this.setState({ clusterDetails: false, clusterId: false });
        });
    }

    processParts(clusterId, parts) {
        const TYPE_TRANSLATION = {
            "dashboard": "Dashboards",
            "visualization": "Visualizations",
            "search": "Searches",
            "index-pattern": "Index Patterns",
        }
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
            type: "missing",
            value: parts.edges.filter((e) => e.target === TYPE.MISSING).length
        });

        var graph = ObjectGraph.fromParts(parts);
        this.setState({
            clusterDetails: {
                clusterId,
                parts,
                stats,
                graph
            },
            filteredGraph: graph,
            filterDashboard: null,
            filterIndex: null
        });
    }

    updateFilteredGraph(filtered) {
        this.setState({ filteredGraph: filtered });
    }

    onFilterChange = (type, value) => {
        switch(type[0]) {
            case TYPE.DASHBOARD:
                this.applyFilters(value, this.state.filterIndex);
                break;
            case TYPE.INDEX_PATTERN:
                this.applyFilters(this.state.filterDashboard, value);
                break;
        }
    }

    applyFilters(dashboard, index) {
        if(this.state.clusterDetails === null) {
            return;
        }
        var graph = this.state.clusterDetails.graph;

        if(dashboard !== null) {
            graph = graph.filterForSource(dashboard);
        }

        if(index !== null) {
            graph = graph.filterForSink(index);
        }

        this.setState({
            filteredGraph: graph,
            filterDashboard: dashboard,
            filterIndex: index
        });
    }

    render() {
        const graph = this.state.clusterDetails === null ? null : this.state.clusterDetails.graph;
        return (
            <div>
            <Menu>
                <Menu.Item>
                    Cluster: <ClusterSelector onClusterSelect={this.onClusterSelect}/>
                </Menu.Item>
                <Menu.Item>
                    Filter Dashboards: <FilterSelector type={FILTER_DASHBOARD} graph={graph} onFilterChange={this.onFilterChange}/>
                </Menu.Item>
                <Menu.Item>
                    Filter Index Patterns:{' '}<FilterSelector type={FILTER_INDEX} graph={graph} onFilterChange={this.onFilterChange}/>
                </Menu.Item>
            </Menu>
            <Container style={{ marginTop: '3em' }}>
                <Grid centered>
                    <ClusterDetails cluster={this.state.clusterDetails} />
                </Grid>
                <Segment>
                    <Graph graph={this.state.filteredGraph} width="1000" height="500"/>
                </Segment>
            </Container>
            </div>
        );
    }
}

export default App;

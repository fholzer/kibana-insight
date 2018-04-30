import React, { Component } from 'react';
import './App.css';
import Config from './Config';
import { Menu, Container, Grid, Segment, Divider, Checkbox } from 'semantic-ui-react';
import Graph from './Graph';
import ClusterSelector from './ClusterSelector';
import FilterSelector from './FilterSelector';
import ObjectGraph from './ObjectGraph';
import ObjectList from './ObjectList';
import GraphStats from './GraphStats';
import TYPE from './ObjectTypes';

const FILTER_DASHBOARD = [TYPE.DASHBOARD];
const FILTER_INDEX = [TYPE.INDEX_PATTERN, TYPE.MISSING];

class App extends Component {
    state = {
        clusterId: null,
        clusterDetails: null,
        filterOrphaned: false
    }

    onClusterSelect = (id, name) => {
        this.setState({
            clusterId: id,
            clusterDetails: true
        });
        this.loadParts(id);
    }

    loadParts(clusterId) {
        fetch(Config.apiBaseUrl + '/clusters/' + clusterId + '/parts')
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
        var graph = ObjectGraph.fromParts(parts);
        this.setState({
            clusterDetails: {
                clusterId,
                parts,
                graph
            },
            filteredGraph: graph,
            filterOrphaned: false,
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
                this.applyFilters(value);
                break;
            case TYPE.INDEX_PATTERN:
                this.applyFilters(undefined, value);
                break;
            default:
                throw new Error("Unexpected type " + type[0]);
        }
    }

    onFilterOrphanedChange = (e, { checked }) => {
        this.applyFilters(undefined, undefined, checked);
    }

    applyFilters(dashboard, index, orphaned) {
        if(this.state.clusterDetails === null) {
            return;
        }

        if(dashboard === undefined) {
            dashboard = this.state.filterDashboard;
        }
        if(index === undefined) {
            index = this.state.filterIndex;
        }
        if(orphaned === undefined) {
            orphaned = this.state.filterOrphaned;
        }

        var graph = this.state.clusterDetails.graph;

        if(orphaned) {
            graph = graph.filterForOrphanedNodes();
        }

        if(dashboard !== null) {
            graph = graph.filterForSource(dashboard);
        }

        if(index !== null) {
            graph = graph.filterForSink(index);
        }

        this.setState({
            filteredGraph: graph,
            filterDashboard: dashboard,
            filterIndex: index,
            filterOrphaned: orphaned
        });
    }

    render() {
        const graph = this.state.clusterDetails === null ? null : this.state.clusterDetails.graph;
        const content = graph === null ? null : (
            <Container style={{ marginTop: '3em' }}>
                <Grid centered>
                    <GraphStats graph={graph} size="tiny"/>
                </Grid>
                <Segment>
                    <Grid columns="equal">
                        <Grid.Column width={10}>
                            <Graph graph={this.state.filteredGraph}/>
                        </Grid.Column>
                        <Grid.Column width={6}>
                            <Segment>
                                <GraphStats graph={this.state.filteredGraph} size="mini" />
                            </Segment>
                            <Divider/>
                            <ObjectList graph={this.state.filteredGraph} />
                        </Grid.Column>
                    </Grid>
                </Segment>
            </Container>
        );
        return (
            <div>
            <Menu>
                <Menu.Item>
                    Cluster: <ClusterSelector onClusterSelect={this.onClusterSelect}/>
                </Menu.Item>
                <Menu.Item>
                    <Checkbox checked={this.state.filterOrphaned} onChange={this.onFilterOrphanedChange} label="Orphaned" />
                </Menu.Item>
                <Menu.Item>
                    Dashboards:<FilterSelector type={FILTER_DASHBOARD} graph={graph} onFilterChange={this.onFilterChange}/>
                </Menu.Item>
                <Menu.Item>
                    Index Patterns:<FilterSelector type={FILTER_INDEX} graph={graph} onFilterChange={this.onFilterChange}/>
                </Menu.Item>
            </Menu>
            {content}
            </div>
        );
    }
}

export default App;

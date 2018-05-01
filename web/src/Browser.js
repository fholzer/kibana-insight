import React, { Component } from 'react';
import { Menu, Container, Grid, Segment, Divider, Checkbox } from 'semantic-ui-react';
import Graph from './Graph';
import FilterSelector from './FilterSelector';
import ObjectList from './ObjectList';
import GraphStats from './GraphStats';
import TYPE from './ObjectTypes';

const FILTER_DASHBOARD = [TYPE.DASHBOARD];
const FILTER_INDEX = [TYPE.INDEX_PATTERN, TYPE.MISSING];

class Browser extends Component {
    state = {
        cluster: null,
        filterOrphaned: false,
        filterDashboard: null,
        filterIndex: null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.cluster !== prevState.cluster) {

            var graph = nextProps.cluster.graph,
                filterDashboard = prevState.filterDashboard,
                filterIndex = prevState.filterIndex;

            if(filterDashboard !== null && !graph.hasVertex(filterDashboard)) {
                filterDashboard = null;
            }

            if(filterIndex !== null && !graph.hasVertex(filterIndex)) {
                filterIndex = null;
            }

            var next = {
                cluster: nextProps.cluster,
                filterDashboard,
                filterIndex
            };

            next.filteredGraph = Browser.generateFilteredGraph(Object.assign({}, prevState, next));
            return next;
        }
        return null;
    }

    onFilterChange = (type, value) => {
        switch(type[0]) {
            case TYPE.DASHBOARD:
                this.setState({ filterDashboard: value });
                break;
            case TYPE.INDEX_PATTERN:
                this.setState({ filterIndex: value });
                break;
            default:
                throw new Error("Unexpected type " + type[0]);
        }
        this.updateFilteredGraph();
    }

    onFilterOrphanedChange = (e, { checked }) => {
        this.setState({ filterOrphaned: checked });
        this.updateFilteredGraph();
    }

    static generateFilteredGraph(state) {
        if(state.cluster === null) {
            return;
        }

        var graph = state.cluster.graph,
            dashboard = state.filterDashboard,
            index = state.filterIndex,
            orphaned = state.filterOrphaned;

        if(orphaned) {
            graph = graph.filterForOrphanedNodes();
        }

        if(dashboard !== null) {
            graph = graph.filterForSource(dashboard);
        }

        if(index !== null) {
            graph = graph.filterForSink(index);
        }

        return graph;
    }

    updateFilteredGraph() {
        if(this.state.cluster === null) {
            return;
        }

        this.setState(prev => ({
            filteredGraph: Browser.generateFilteredGraph(prev)
        }));
    }

    render() {
        if(this.state.cluster === null || this.state.cluster === true) {
            return null;
        }

        const graph = this.state.cluster.graph;

        return (
            <Container fliud>
                <Segment textAlign="center" basic>
                    <Menu compact>
                        <Menu.Item>
                            <Checkbox checked={this.state.filterOrphaned} onChange={this.onFilterOrphanedChange} label="Orphaned" />
                        </Menu.Item>
                        <Menu.Item>
                            Dashboards:<FilterSelector type={FILTER_DASHBOARD} graph={graph} value={this.state.filterDashboard} onFilterChange={this.onFilterChange}/>
                        </Menu.Item>
                        <Menu.Item>
                            Index Patterns:<FilterSelector type={FILTER_INDEX} graph={graph} value={this.state.filterIndex} onFilterChange={this.onFilterChange}/>
                        </Menu.Item>
                    </Menu>
                </Segment>
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
                            <ObjectList cluster={this.state.cluster} graph={this.state.filteredGraph} />
                        </Grid.Column>
                    </Grid>
                </Segment>
            </Container>
        );
    }
}

export default Browser;

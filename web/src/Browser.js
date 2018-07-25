import React, { Component } from 'react';
import { Menu, Container, Grid, Segment, Divider, Dropdown } from 'semantic-ui-react';
import SafeGraph from './SafeGraph';
import ObjectList from './ObjectList';
import GraphStats from './GraphStats';

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

export default class Browser extends Component {
    state = {
        cluster: null,
        filterType: "none"
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

        var next = {
            cluster: cluster
        };

        next.filteredGraph = Browser.generateFilteredGraph(Object.assign({}, this.state, next));
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
            let target = "/" + this.props.match.params.cluster
                + "/browser/none";
            this.props.history.push(target);
            return
        }

        this.setState({
            filterType,
            filterEntity
        });
        this.updateFilteredGraph();
    }

    onFilterTypeChange = (e, { value }) => {
        if(this.state.filterType === value) {
            return;
        }

        let match = FILTER_TYPE_LIST.filter(e => e.id === value);
        match = match[0];

        let target = "/" + this.props.match.params.cluster
            + "/browser/" + match.id;
        this.props.history.push(target);
    }

    onFilterEntityChange = (e, { value }) => {
        if(this.state.filterEntity === value) {
            return;
        }

        let target = "/" + this.props.match.params.cluster
            + "/browser/" + value;
        this.props.history.push(target);
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
            filteredGraph: Browser.generateFilteredGraph(prev)
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
            .sort(Browser.objectTitleComparator)
            .map((n) => ({ key: n.id, text: n.title, value: n.id }));
    }

    static objectTitleComparator(s1, s2) {
        if(!s1.title || !s2.title) {
            console.log("has no title:", s1, s2);
            return 0;
        }
        return s1.title.localeCompare(s2.title);
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
                <Segment textAlign="center" basic>
                    <Menu compact stackable>
                        <Menu.Item>
                            Filter Type: <Dropdown
                                selection
                                search
                                options={filterTypeOptions}
                                value={this.state.filterType}
                                onChange={this.onFilterTypeChange} />
                        </Menu.Item>
                        <Menu.Item {...filterEntityProps}>
                            Filter Entity: <Dropdown
                                selection
                                search
                                 {...filterEntityProps}
                                options={filterEntityOptions}
                                value={this.state.filterEntity}
                                onChange={this.onFilterEntityChange} />
                        </Menu.Item>
                    </Menu>
                </Segment>
                <Segment>
                    <Grid columns="equal">
                        <Grid.Column width={10}>
                            <SafeGraph graph={this.state.filteredGraph}/>
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

import React, { Component } from 'react';
import './App.css';
import { Menu, Container, Grid, Segment } from 'semantic-ui-react';
import Graph from './Graph';
import ClusterSelector from './ClusterSelector';
import FilterSelector from './FilterSelector';
import ClusterDetails from './ClusterDetails';
import ObjectGraph from './ObjectGraph';
import TYPE from './ObjectTypes';

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
                this.setState({ parts: false });
            }
            return res.json();
        })
        .then((json) => this.processParts(clusterId, json))
        .catch((err) => {
            console.log(err);
            this.setState({ parts: false });
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
            value: parts.edges.filter((e) => e.target === TYPE.MISSING).length
        });

        var graph = ObjectGraph.fromParts(parts);
        this.setState({
            clusterDetails: {
                clusterId,
                parts,
                stats,
                graph
            }
        });
    }

    render() {
        return (
            <div>
            <Menu>
                <Menu.Item>
                    Cluster: <ClusterSelector onClusterSelect={this.onClusterSelect}/>
                </Menu.Item>
                <Menu.Item>
                    Filter Dashboards: <FilterSelector type={TYPE.DASHBOARD} cluster={this.state.clusterDetails} onFilterSelect={this.onFilterSelect}/>
                </Menu.Item>
                <Menu.Item>
                    Filter Index Patterns:{' '}<FilterSelector type={TYPE.INDEX_PATTERN} cluster={this.state.clusterDetails} onFilterSelect={this.onFilterSelect}/>
                </Menu.Item>
            </Menu>
            <Container style={{ marginTop: '3em' }}>
                <Grid centered>
                    <ClusterDetails cluster={this.state.clusterDetails} />
                </Grid>
                <Segment>
                    <Graph cluster={this.state.clusterDetails} width="1000" height="500"/>
                </Segment>
            </Container>
            </div>
        );
    }
}

export default App;

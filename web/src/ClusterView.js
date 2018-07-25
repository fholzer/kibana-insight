import React, { Component } from 'react';
import { Route, NavLink } from "react-router-dom";
import Config from './Config';
import { Menu, Container, Grid } from 'semantic-ui-react';
import ClusterSelectionDropdown from './ClusterSelectionDropdown';
import ObjectGraph from './ObjectGraph';
import GraphStats from './GraphStats';
import Browser from './Browser';
import Exporter from './Exporter';

export default class ClusterView extends Component {
    state = {
        cluster: true
    }

    componentDidMount() {
        this.loadParts(this.props.match.params.cluster);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.match.params.cluster !== prevProps.match.params.cluster) {
            this.loadParts(this.props.match.params.cluster);
        }
    }

    loadParts(clusterId) {
        fetch(Config.apiBaseUrl + '/clusters/' + clusterId + '')
        .then((res) => {
            if(!res.ok) {
                console.log(res);
                this.setState({ cluster: false, clusterId: false });
            }
            return res.json();
        })
        .then((json) => {
            this.setState({
                cluster: {
                    clusterId,
                    config: json.config,
                    parts: json.parts,
                    graph: ObjectGraph.fromParts(json.parts)
                }
            });
        })
        .catch((err) => {
            console.log(err);
            this.setState({ cluster: false, clusterId: false });
        });
    }

    handleMenuClick = (e, { name }) => this.setState({ activeMenu: name })

    render() {
        if(this.state.clusters === true) {
            return this.renderSegment(<p>loading...</p>);
        }
        if(this.state.clusters === false) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        const graph = this.state.cluster.graph;
        const cname = this.props.match.params.cluster;
        return (
            <div>
                <Menu>
                    <Route path="/:cluster?/:app?" item component={ClusterSelectionDropdown}/>
                    <Menu.Item as={NavLink} to={`/${cname}/browser`}>Browser</Menu.Item>
                    <Menu.Item as={NavLink} to={`/${cname}/exporter`}>Exporter</Menu.Item>
                </Menu>

                <Container style={{ marginTop: '3em' }}>
                    <Grid centered>
                        <GraphStats graph={graph} size="tiny"/>
                    </Grid>

                    <Route path="/:cluster/browser/:filter?" component={this.renderBrowser}/>
                    <Route path="/:cluster/exporter/:filter?" component={this.renderExporter}/>
                </Container>
            </div>
        );
    }
    renderBrowser = (props) => <Browser {...props} cluster={this.state.cluster} />
    renderExporter = (props) => <Exporter {...props} cluster={this.state.cluster} />
}

import React, { Component } from 'react';
import { Route } from "react-router-dom";
import { Container, Segment, Header, Grid } from 'semantic-ui-react';
import Config from './Config';
import GraphStats from './GraphStats';
import ObjectGraph from './ObjectGraph';
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

    renderSegment(child, header) {
        if(header) {
            header = <Header as="h1" attached="top">{header}</Header>
        }
        const bottomProps = header ? { attached: "bottom" } : {};
        return (
            <Container className="clusterselector">
                {header}
                <Segment {...bottomProps}>{child}</Segment>
            </Container>
        )
    }

    render() {
        const { cluster } = this.state;
        if(cluster === true) {
            return this.renderSegment(<p>loading...</p>);
        }
        if(cluster === false) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        const graph = cluster.graph;
        return (
            <Container style={{ marginTop: '3em' }}>
                <Grid centered>
                    <GraphStats graph={graph} size="tiny"/>
                </Grid>

                <Route path="/cluster/:cluster/browser/:filter?" component={this.renderBrowser}/>
                <Route path="/cluster/:cluster/exporter/:filter?" component={this.renderExporter}/>
            </Container>
        );
    }
    renderBrowser = (props) => <Browser {...props} cluster={this.state.cluster} />
    renderExporter = (props) => <Exporter {...props} cluster={this.state.cluster} />
}

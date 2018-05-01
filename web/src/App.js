import React, { Component } from 'react';
import './App.css';
import Config from './Config';
import { Menu, Container, Grid } from 'semantic-ui-react';
import ClusterSelector from './ClusterSelector';
import ObjectGraph from './ObjectGraph';
import GraphStats from './GraphStats';
import Browser from './Browser';
import Exporter from './Exporter';

class App extends Component {
    state = {
        activeMenu: "browser",
        clusterId: null,
        cluster: null,
    }

    onClusterSelect = (id, name) => {
        this.setState({
            clusterId: id
        });
        this.loadParts(id);
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
        const activeMenu = this.state.activeMenu;
        const graph = this.state.cluster && this.state.cluster !== true ? this.state.cluster.graph : null;

        var content;
        switch(activeMenu) {
            case "browser":
                content = <Browser cluster={this.state.cluster} />;
                break;
            case "exporter":
                content = <Exporter cluster={this.state.cluster} />;
                break;
            default:
                content = <p>Ooops</p>;
        }

        return (
            <div>
            <Menu>
                <ClusterSelector item onClusterSelect={this.onClusterSelect}/>
                <Menu.Item
                    name="browser"
                    active={"browser" === activeMenu}
                    onClick={this.handleMenuClick} >Browser</Menu.Item>
                <Menu.Item
                    name="exporter"
                    active={"exporter" === activeMenu}
                    onClick={this.handleMenuClick} >Exporter</Menu.Item>
            </Menu>

            <Container style={{ marginTop: '3em' }}>
                <Grid centered>
                    <GraphStats graph={graph} size="tiny"/>
                </Grid>
                {content}
            </Container>
            </div>
        );
    }
}

export default App;

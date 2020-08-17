import React, { Component } from 'react';
import { NavLink, Redirect, BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Menu, Container, Segment, Header } from 'semantic-ui-react';
import './App.css';
import Config from './Config';
import ClusterSelector from './ClusterSelector';
import ClusterView from './ClusterView';
import TemplateOverview from  './TemplateOverview';
import MappingOverview from  './MappingOverview';

class App extends Component {
    state = {
        clusters: true
    }

    componentDidMount() {
        this.loadClusters();
    }

    loadClusters() {
        fetch(Config.apiBaseUrl + '/clusters')
        .then((res) => {
            if(!res.ok) {
                console.log(res);
                this.setState({ clusters: false });
            }
            return res.json();
        })
        .then((json) => this.setState({ clusters: json }))
        .catch((err) => {
            console.log(err);
            this.setState({ clusters: false });
        });
    }

    renderSegment(child, header) {
        if(header) {
            header = (<Header as="h1" attached="top">{header}</Header>);
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
        const {
            clusters,
        } = this.state;

        if(clusters === true) {
            return this.renderSegment(<p>loading...</p>);
        }
        if(clusters === false) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        return (
            <Router>
                <>
                <Menu>
                    <Menu.Item as={NavLink} to="/" exact>Cluster Selection</Menu.Item>
                    <Menu.Menu position="right">
                        <Menu.Item as={NavLink} to="/mappings">Mapping</Menu.Item>
                        <Menu.Item as={NavLink} to="/templates">Templates</Menu.Item>
                    </Menu.Menu>
                </Menu>

                <Container style={{ marginTop: '3em' }}>
                    <Switch>
                        <Redirect exact from="/" to="/cluster"/>
                        <Route path="/templates" component={TemplateOverview}/>
                        <Route path="/mappings" component={MappingOverview}/>
                        <Route path="/cluster" exact component={this.renderClusterSelector}/>
                        <Route path="/cluster/:cluster" component={this.renderClusterView}/>
                    </Switch>
                </Container>
                </>
            </Router>
        );
    }


    renderClusterSelector = (props) => <ClusterSelector {...props} clusters={this.state.clusters}/>
    renderClusterView = (props) => <ClusterView {...props} clusters={this.state.clusters} />
}

export default App;

import React, { Component } from 'react';
import { Container, Grid, Segment, Divider, Form, Dropdown, Checkbox, Button } from 'semantic-ui-react';
import Config from './Config';
import Graph from './Graph';
import ObjectGraph from './ObjectGraph';
import ObjectList from './ObjectList';
import GraphStats from './GraphStats';
import TYPE from './ObjectTypes';

const TYPES_EXPORTABLE = [TYPE.DASHBOARD, TYPE.VISUALIZATION, TYPE.SEARCH];

export default class Exporter extends Component {
    state = {
        cluster: null,
        selectedNode: null,
        selectWithDeps: true
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.cluster !== prevState.cluster) {
            const exportable = nextProps.cluster.parts.nodes
                .filter(n => TYPES_EXPORTABLE.indexOf(n.type) !== -1)
                .sort(Exporter.objectTypeTitleComparator)
                .map((n) => ({ key: n.id, text: n.title, value: n.id, image: process.env.PUBLIC_URL + "/img/" + n.type + ".svg" }));

            return {
                cluster: nextProps.cluster,
                exportable,
                selectedNode: null,
                selectedGraph: null,
                stagedGraph: ObjectGraph.empty()
            };
        }
        return null;
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

    onSelectedNodeChange = (e, { value }) => {
        if(value) {
            this.setState({ selectedNode: value });
            this.updateSelectGraph();
        }
    }

    onWithDepsChanged = (e, { checked }) => {
        this.setState({ selectWithDeps: checked });
        this.updateSelectGraph();
    }

    onAddSelectionClick = () => {
        this.setState(prev => {
            if(!prev.selectedNode) {
                return null;
            }

            var additional = prev.selectWithDeps ?
                prev.cluster.graph.filterForRelated(prev.selectedNode) :
                prev.cluster.graph.filterForNode(prev.selectedNode);

            return {
                stagedGraph: prev.stagedGraph.merge(additional)
            }
        });
    }

    onDownloadClick = () => {
        var ids = this.state.stagedGraph.toD3().nodes.map(n => n.id);
        fetch(Config.apiBaseUrl + '/clusters/' + this.state.cluster.clusterId + '/export',
            {
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json'
                },
                method: "POST"
            })
    }

    updateSelectGraph() {
        this.setState(prev => {
            if(!prev.selectedNode) {
                return null;
            }

            var g = prev.selectWithDeps ?
                prev.cluster.graph.filterForRelated(prev.selectedNode) :
                prev.cluster.graph.filterForNode(prev.selectedNode);

            return {
                selectedGraph: g
            }
        });
    }

    render() {
        if(this.state.cluster === null || this.state.cluster === true) {
            return null;
        }

        const options = this.state.exportable

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
                                    <Dropdown selection search fluid options={options} onChange={this.onSelectedNodeChange} />
                                </Form.Field>
                                <Form.Field>
                                    <Checkbox checked={this.state.selectWithDeps} onChange={this.onWithDepsChanged} label="Include Dependencies" />
                                </Form.Field>
                                <Form.Field>
                                    <Button
                                        floated="right"
                                        style={{ marginBottom: "1em" }}
                                        onClick={this.onAddSelectionClick}
                                        disabled={!this.state.selectedNode}>Add Selection</Button>
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

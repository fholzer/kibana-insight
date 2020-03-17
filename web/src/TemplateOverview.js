import React, { Component } from 'react';
import { Container, Segment, Table, Form, Checkbox } from 'semantic-ui-react';
import Config from './Config';

const MANAGED_PREFIXES = [
    "logstash-",
    "filebeat-",
    "metricbeat-",
    "heartbeat-",
    "packetbeat-",
    "winlogbeat-",
    "cloudflarebeat-"
];

export default class TemplateOverview extends Component {
    state = {
        templates: true,
        showManaged: false,
        showSystem: false
    }

    componentDidMount() {
        fetch(Config.apiBaseUrl + '/templates')
        .then((res) => {
            if(!res.ok) {
                console.log(res);
                this.setState({ templates: false });
            }
            return res.json();
        })
        .then((json) => this.setState({ templates: json }))
        .catch((err) => {
            console.log(err);
            this.setState({ templates: false });
        });
    }

    renderTemplateTable(data, showSystem, showManaged, ignoreAbsence) {
        const clusters = data.clusters.filter(e => e !== null);
        const clusterNames = clusters.map(c => c.name);
        const clusterHeaders = clusterNames.map(c => (<Table.HeaderCell key={c} content={c}/>));
        clusterHeaders.unshift((<Table.HeaderCell key="-1"/>));

        var templates = data.allTemplates;
        if(showSystem !== true) {
            templates = templates.filter(t => t.substring(0, 1) !== ".")
        }
        if(showManaged !== true) {
            templates = templates.filter(t => {
                for(let p of MANAGED_PREFIXES) {
                    if(t.startsWith(p)) {
                        return false;
                    }
                }
                return true;
            });
        }

        templates = templates.sort();
        const rows = [];
        for(let t of templates) {
            let check = clusters.map(c => c.templates[t]).filter(t => t !== undefined);
            let highlight = 0;
            if(check.length > 1) {
                highlight = 1;
                for(let i = 1; i < check.length; i++) {
                    if(check[i] !== check[0]) {
                        highlight = 2;
                        break;
                    }
                }
            }
            let cols = clusters.map(c => {
                let val = "";
                if(c.templates.hasOwnProperty(t)) {
                    val = c.templates[t].substring(0, 4);
                }
                return (<Table.Cell key={c.name}>{val}</Table.Cell>);
            });
            cols.unshift((<Table.Cell key={-1}>{t}</Table.Cell>));
            rows.push((<Table.Row key={t} positive={highlight === 1} negative={highlight === 2}>{cols}</Table.Row>));
        }

        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        {clusterHeaders}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows}
                </Table.Body>
            </Table>
        )
    }

    renderSegment(content) {
        return (<Container text><Segment>{content}</Segment></Container>);
    }

    onCheckboxChanged = (e, { name }) => {
        this.setState(prev => ({
            [name]: !prev[name]
        }));
    }

    render() {
        const {
            showManaged,
            showSystem,
            templates
        } = this.state;

        if(templates === true) {
            return this.renderSegment(<p>loading...</p>);
        }

        const numClusters = templates ? templates.clusters.filter(e => e !== null).length : 0;
        if(templates === false || numClusters < 1) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        const table = this.renderTemplateTable(templates, showSystem, showManaged);

        return (
            <Container text>
                <Segment>
                <Form>
                    <Form.Group widths='equal' inline>
                            <Form.Checkbox name="showManaged" label="Show managed templates" onChange={this.onCheckboxChanged} checked={this.state.showManaged} />
                            <Form.Checkbox name="showSystem" label="Show system templates" onChange={this.onCheckboxChanged} checked={this.state.showSystem} />
                    </Form.Group>
                </Form>
                </Segment>
                <Segment>{table}</Segment>
            </Container>
        )
    }
}

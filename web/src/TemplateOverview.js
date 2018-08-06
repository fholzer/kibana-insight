import React, { Component } from 'react';
import { Route } from "react-router-dom";
import { Container, Segment, Table } from 'semantic-ui-react';
import Config from './Config';

export default class TemplateOverview extends Component {
    state = {
        templates: true
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

    renderTemplateTable(data, sys, beat) {
        const clusterNames = data.clusters.map(c => c.name);
        const clusterHeaders = clusterNames.map(c => (<Table.HeaderCell key={c} content={c}/>));
        clusterHeaders.unshift((<Table.HeaderCell key="-1"/>));

        var templates = data.allTemplates;
        if(sys !== true) {
            templates = templates.filter(t => t.substring(0, 1) !== ".")
        }

        templates = templates.sort();
        const rows = [];
        for(let t of templates) {
            let check = data.clusters.map(c => c.templates[t]).filter(t => t !== undefined);
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
            let cols = data.clusters.map(c => {
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

    render() {
        const templates = this.state.templates;
        if(templates === true) {
            return this.renderSegment(<p>loading...</p>);
        }
        if(templates === false) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        return this.renderSegment(this.renderTemplateTable(templates));
    }
}

import React, { Component } from 'react';
import { Modal, Popup, Accordion, Container, Segment, Table, Icon } from 'semantic-ui-react';
import Config from './Config';

const collator = new Intl.Collator('en', { 'sensitivity': 'base' }).compare;
const isString = e => (typeof e === 'string' || e instanceof String);

export default class MappingOverview extends Component {
    state = {
        mappings: true
    }

    componentDidMount() {
        fetch(Config.apiBaseUrl + '/mapping')
        .then((res) => {
            if(!res.ok) {
                console.log(res);
                this.setState({ mappings: false });
            }
            return res.json();
        })
        .then((json) => this.setState({ mappings: json }))
        .catch((err) => {
            console.log(err);
            this.setState({ mappings: false });
        });
    }

    renderMappingConflictModal(cluster, mappingConflict, trigger) {
        return (
            <Modal
              closeIcon
              size="small"
              trigger={trigger}
            >
              <Modal.Header>Mapping Conflicts for index pattern "{mappingConflict.pattern}" on cluster "{cluster.name}"</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <Accordion styled defaultActiveIndex={-1} panels={this.renderMappingConflictSegments(mappingConflict.result)} />
                </Modal.Description>
              </Modal.Content>
            </Modal>
        );
    }

    renderMappingConflictSegments(mappingConflict) {
        let fieldSegments = []
        for(let field of Object.keys(mappingConflict).sort(collator)) {
            let fieldData = mappingConflict[field];

            let typeRows = []
            for(let type of Object.keys(fieldData).sort(collator)) {
                let typeData = fieldData[type];
                let indexList = typeData.sort(collator).map(e => (<li key={e}>{e}</li>));
                typeRows.push((
                    <div key={type}>
                        <h4>...is of type "{type}" in these indices:</h4>
                        <ul>
                            {indexList}
                        </ul>
                    </div>
                ))
            }
            fieldSegments.push({ key: field, title: `Field "${field}"`, content: { content: typeRows }});
        }
        return fieldSegments;
    }

    renderMappingTable(clusters) {
        const clusterHeaders = clusters.map(c => (<Table.HeaderCell key={c.name} content={c.name}/>));
        clusterHeaders.unshift((<Table.HeaderCell key="-1"/>));

        const indexPatterns = clusters.reduce((acc, cur) => {
            return cur.result.reduce((a, c) => acc.add(c.pattern));
        }, new Set());

        const rows = [];
        for(let ip of [...indexPatterns].sort(collator.compare)) {
            let cols = clusters.map(c => {
                let val = "";
                let highlight = 0;
                let match;
                if(match = c.result.find(e => e.pattern === ip)) {
                    if(isString(match.result)) {
                        highlight = 3
                        val = (<Popup content='Index pattern defined in kibana, but no matching indices found.' trigger={<Icon name="question circle"/>} />);
                    } else if(Object.keys(match.result).length > 1) {
                        highlight = 2;
                        val = this.renderMappingConflictModal(c, match, (<Icon link name="exclamation triangle"/>));
                    } else {
                        highlight = 1;
                    }
                }
                return (<Table.Cell key={c.name} positive={highlight === 1} negative={highlight === 2} warning={highlight === 3} textAlign="center">{val}</Table.Cell>);
            });
            cols.unshift((<Table.Cell key={-1}>{ip}</Table.Cell>));
            rows.push((<Table.Row key={ip}>{cols}</Table.Row>));
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
        );
    }

    renderSegment(content) {
        return (<Container text><Segment>{content}</Segment></Container>);
    }

    render() {
        const {
            mappings
        } = this.state;

        if(mappings === true) {
            return this.renderSegment(<p>loading...</p>);
        }

        const numClusters = mappings ? mappings.filter(e => e !== null).length : 0;
        if(mappings === false || numClusters < 1) {
            return this.renderSegment(<p>Error while loading data.</p>);
        }

        let messages = null;
        let errClusters = mappings.filter(e => isString(e.result));
        if(errClusters.length > 0) {
            messages = errClusters.map(e => (<pre key={e.name}>{e.result}</pre>));
            messages = (<Segment>{messages}</Segment>);
        }


        let okClusters = mappings.filter(e => !isString(e.result));
        const table = this.renderMappingTable(okClusters);

        return (
            <Container text>
                {messages}
                <Segment>{table}</Segment>
            </Container>
        )
    }
}

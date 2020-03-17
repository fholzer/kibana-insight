import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Container, Segment, Header, Card, Button } from 'semantic-ui-react';

export default class ClusterSelector extends Component {
    clusterCardMapper = (cluster) => {
        return (
            <Card key={cluster.name}>
                <Card.Content>
                    <Card.Header>{cluster.name}</Card.Header>
                    <Card.Meta>Version {cluster.version}</Card.Meta>
                    <Card.Description>{cluster.url}</Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                        <Button as={Link} to={`/cluster/${cluster.name}/browser`}>Browse</Button>
                        <Button as={Link} to={`/cluster/${cluster.name}/exporter`}>Export</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }

    render() {
        const cards = this.props.clusters.map(this.clusterCardMapper);
        return (
            <Container className="clusterselector">
                <Header as="h1" attached="top">Select a cluster</Header>
                <Segment basic>
                <Card.Group centered>{cards}</Card.Group>
                </Segment>
            </Container>
        );
    }
}

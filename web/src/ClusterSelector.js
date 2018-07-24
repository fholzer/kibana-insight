import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Route } from "react-router-dom";
import { Menu, Container, Segment, Header, Grid, Icon } from 'semantic-ui-react';
import Config from './Config';
import ClusterSelectionDropdown from './ClusterSelectionDropdown';

export default class ClusterSelector extends Component {
    static propTypes = {
        history: PropTypes.shape({
            push: PropTypes.func.isRequired
        }).isRequired
    }
    state = {
        clusters: true
    }

    componentDidMount() {
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

    onClick = c => {
        this.props.history.push("/" + c);
    }

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
        return (
            <div>
                <Menu>
                    <Route path="/:cluster?/:app?" item component={ClusterSelectionDropdown}/>
                </Menu>
            </div>
        );
    }
}

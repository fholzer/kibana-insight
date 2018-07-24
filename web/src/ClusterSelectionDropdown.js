import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Config from './Config';
import { Dropdown } from 'semantic-ui-react';

export default class ClusterSelectionDropdown extends Component {
    static propTypes = {
        history: PropTypes.shape({
            push: PropTypes.func.isRequired
        }).isRequired
    }
    state = {
        clusters: true
    }

    componentDidMount() {
        this.setState({ selected: this.props.match.params.cluster });
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.match.params.cluster !== prevProps.match.params.cluster) {
            this.setState({ selected: this.props.match.params.cluster });
        }
    }

    onClusterSelect = (e, { value }) => {
        let target = "/" + value
        if(this.props.match.params.app) {
            target += "/" + this.props.match.params.app;
        }
        this.props.history.push(target);
    }

    render() {
        if(this.state.clusters === true) {
            return <Dropdown item placeholder="loading..." disabled />;
        }
        if(this.state.clusters === false) {
            return <p>Error while loading data.</p>;
        }

        const options = this.state.clusters.map((c, i) => ({ text: c, value: c }));
        const selected = this.state.selected;
        return <Dropdown item placeholder='Select Cluster'  options={options} value={selected} onChange={this.onClusterSelect} />
    }
}

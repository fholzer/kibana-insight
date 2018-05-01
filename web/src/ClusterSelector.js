import React, { Component } from 'react';
import Config from './Config';
import { Dropdown } from 'semantic-ui-react';

export default class ClusterSelector extends Component {
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

    onClusterSelect = (e, { value }) => {
        if(typeof this.props.onClusterSelect === 'function') {
            this.props.onClusterSelect(value, this.state.clusters[value]);
        }
    }

    render() {
        if(this.state.clusters === true) {
            return <Dropdown item placeholder="loading..." disabled />;
        }
        if(this.state.clusters === false) {
            return <p>Error while loading data.</p>;
        }

        const options = this.state.clusters.map((c, i) => ({ text: c, value: i }));
        return <Dropdown item placeholder='Select Cluster'  options={options} onChange={this.onClusterSelect} />
    }
}

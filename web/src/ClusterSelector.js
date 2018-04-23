import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

export default class ClusterSelector extends Component {
    state = {
        clusters: true
    }

    componentDidMount() {
        fetch('http://127.0.0.1:3001/clusters')
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
            return <p>Loading...</p>;
        }
        if(this.state.clusters === false) {
            return <p>Error while loading data.</p>;
        }

        const options = this.state.clusters.map((c, i) => ({ text: c, value: i }));
        return <Dropdown placeholder='Select Cluster' selection options={options} onChange={this.onClusterSelect} />
    }
}

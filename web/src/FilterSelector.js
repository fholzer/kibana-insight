import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

const FILTER_NONE = Object.freeze({
    key: "null",
    text: "No Filter",
    value: "null"
});

export default class FilterSelector extends Component {
    state = {
        cluster: null,
        filter: "null"
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if((nextProps.cluster !== prevState.cluster ||
            nextProps.type !== prevState.type) &&
            nextProps.cluster &&
            nextProps.cluster !== true &&
            nextProps.type) {
            const options = nextProps.cluster.parts.nodes
                .filter((n) => n.type === nextProps.type)
                .map((n) => ({ key: n.id, text: n.title, value: n.id }))
                .concat(FILTER_NONE);

            return {
                options,
                filter: "null"
            };
        }
        return null;
    }

    onFilterChange = (e, { value }) => {
        if(typeof this.props.onFilterChange === 'function') {
            this.props.onFilterChange(value === "null" ? null : value);
        }
        this.setState({ filter: value });
    }

    render() {
        const options = this.state.options ? this.state.options : [FILTER_NONE]

        return <Dropdown
            selection
            search
            options={options}
            value={this.state.filter}
            onChange={this.onFilterChange} />;
    }
}

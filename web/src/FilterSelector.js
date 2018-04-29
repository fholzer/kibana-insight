import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

const FILTER_NONE = Object.freeze({
    key: "null",
    text: "No Filter",
    value: "null"
});

export default class FilterSelector extends Component {
    state = {
        graph: null,
        filter: "null"
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if((nextProps.graph !== prevState.graph ||
            nextProps.type !== prevState.type) &&
            nextProps.graph &&
            nextProps.type) {
            const options = nextProps.graph.toD3().nodes
                .filter((n) => nextProps.type.indexOf(n.type) !== -1)
                .map((n) => ({ key: n.id, text: n.title, value: n.id }))
                .concat(FILTER_NONE);

            return {
                graph: nextProps.graph,
                type: nextProps.type,
                options,
                filter: "null"
            };
        }
        return null;
    }

    onFilterChange = (e, { value }) => {
        this.setState({ filter: value });
        if(typeof this.props.onFilterChange === 'function') {
            this.props.onFilterChange(this.props.type, value === "null" ? null : value);
        }
    }

    render() {
        const options = this.state.options ? this.state.options : [FILTER_NONE];

        return <Dropdown
            selection
            search
            options={options}
            value={this.state.filter}
            onChange={this.onFilterChange} />;
    }
}

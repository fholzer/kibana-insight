import React, { Component } from 'react';
import { Statistic, Image } from 'semantic-ui-react';

export default class GraphStats extends Component {
    state = {
        graph: null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.graph !== prevState.graph) {
            return { graph: nextProps.graph };
        }
        return null;
    }

    render() {
        if(!this.state.graph) {
            return (
                <Statistic className="objectStats">
                    <Statistic.Value>{'\u00A0'}</Statistic.Value>
                    <Statistic.Label>{'\u00A0'}</Statistic.Label>
                </Statistic>
            );
        }

        const stats = this.state.graph.calculateStats().map((s) => (
            <Statistic key={s.key} className="objectStats">
                <Statistic.Value>
                    <Image src={process.env.PUBLIC_URL + "/img/" + s.key + ".svg"} inline /> {s.value}
                </Statistic.Value>
                <Statistic.Label>{s.label}</Statistic.Label>
            </Statistic>
        ))

        return (
            <Statistic.Group size={this.props.size}>
                {stats}
            </Statistic.Group>
        );
    }
}

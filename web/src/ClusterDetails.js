import React, { Component } from 'react';
import { Statistic, Image } from 'semantic-ui-react';

export default class ClusterDetails extends Component {
    state = {
        cluster: null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.cluster !== prevState.cluster) {
            return { cluster: nextProps.cluster };
        }
        return null;
    }

    render() {
        if(this.state.cluster === false) {
            return;
        }

        if(this.state.cluster === null || this.state.cluster === true) {
            return (
                <Statistic className="objectStats">
                    <Statistic.Value>{'\u00A0'}</Statistic.Value>
                    <Statistic.Label>{'\u00A0'}</Statistic.Label>
                </Statistic>
            );
        }

        const stats = this.state.cluster.stats.map((s) => (
            <Statistic key={s.key} className="objectStats">
                <Statistic.Value>
                    <Image src={process.env.PUBLIC_URL + "/img/" + s.key + ".svg"} inline /> {s.value}
                </Statistic.Value>
                <Statistic.Label>{s.label}</Statistic.Label>
            </Statistic>
        ))

        return <Statistic.Group size="tiny">
            {stats}
            </Statistic.Group>;
    }
}

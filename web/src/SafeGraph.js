import React, { Component } from 'react'
import Graph from './Graph';

const MAX_SAFE_NODE_COUNT = 200;

export default class SafeGraph extends Component {
    state = {
        graph: null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.graph !== prevState.graph) {
            return {
                graph: nextProps.graph,
                acknowledged: false
            };
        }
        return null;
    }

    onAcknowledge = () => this.setState({ acknowledged: true })

    render() {
        const graph = this.state.graph;
        const acked = this.state.acknowledged;
        const count = graph.nodeCount();

        if(count > MAX_SAFE_NODE_COUNT && !acked) {
            return this.renderWarning(count);
        }

        return this.renderGraph();
    }

    renderWarning(count) {
        const height = this.props.height ? this.props.height : "100%";
        return (
            <div className="graphsizewarning" ref={node => this.rootnode = node} width="100%" height={height}>
            <p>Whoa, this graph is big! It has {count} nodes. <a className="link" onClick={this.onAcknowledge}>Click here</a> if you still want to load it.</p>
            </div>
        )
    }

    renderGraph() {
        return <Graph graph={this.state.graph}/>;
    }
}

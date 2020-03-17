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
            <div className="graphsizewarning" ref={node => this.rootnode = node} width="100%" style={{ height }}>
            <p>Whoa, this graph is big! It has {count} nodes. <button onClick={this.onAcknowledge}>Click here</button> if you still want to load it.</p>
            </div>
        )
    }

    renderGraph() {
        const props = Object.assign({}, this.props);
        delete props.graph;
        return <Graph graph={this.state.graph} height={this.props.height}/>;
    }
}

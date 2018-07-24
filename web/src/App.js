import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './App.css';
import ClusterSelector from './ClusterSelector';
import ClusterView from './ClusterView';

class App extends Component {

    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/" exact component={ClusterSelector}/>
                    <Route path="/:cluster" component={ClusterView}/>
                </Switch>
            </Router>
        );
    }
}

export default App;

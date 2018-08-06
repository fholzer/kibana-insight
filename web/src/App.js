import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './App.css';
import ClusterSelector from './ClusterSelector';
import ClusterView from './ClusterView';
import TemplateOverview from  './TemplateOverview';

class App extends Component {

    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/" exact component={ClusterSelector}/>
                    <Route path="/templates" component={TemplateOverview}/>
                    <Route path="/:cluster" component={ClusterView}/>
                </Switch>
            </Router>
        );
    }
}

export default App;

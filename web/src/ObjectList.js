import React, { Component } from 'react';
import { List, Image } from 'semantic-ui-react';
import TYPE from './ObjectTypes';

const TYPE_TRANSLATION = {
    "dashboard": "Dashboards",
    "visualization": "Visualizations",
    "search": "Searches",
    "index-pattern": "Index Patterns",
}

export default class ObjectList extends Component {
    state = {
        graph: null
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(nextProps.graph !== prevState.graph) {
            return { graph: nextProps.graph };
        }
        return null;
    }

    static objectTitleComparator(s1, s2) {
        if(!s1.title || !s2.title) {
            console.log("has no title:", s1, s2);
            return 0;
        }
        return s1.title.localeCompare(s2.title);
    }

    render() {
        if(!this.state.graph) {
            return null;
        }

        const parts = this.state.graph.toD3();

        var stats = [
            TYPE.DASHBOARD,
            TYPE.VISUALIZATION,
            TYPE.SEARCH,
            TYPE.INDEX_PATTERN
        ].map((t) => ({
            id: t,
            title: TYPE_TRANSLATION[t],
            children: parts.nodes.filter((n) => n.type === t)
                .sort(ObjectList.objectTitleComparator)
        }));

        stats = stats.filter((t) => t.children.length > 0)
            .map((t) => (
                <List.Item key={t.id}>
                    <List.Header><Image inline src={process.env.PUBLIC_URL + "/img/" + t.id + ".svg"} /> {t.title}</List.Header>
                    <List.List>{
                        t.children.map((n) => ((
                            <List.Item key={n.id}>
                                <List.Header>{n.title}</List.Header>
                                <List.Description>{n.id}</List.Description>
                            </List.Item>
                        )))
                    }</List.List>
                </List.Item>
            ));

        return (
            <List className="objectList">{stats}</List>
        );


        const sstats = [
            TYPE.DASHBOARD,
            TYPE.VISUALIZATION,
            TYPE.SEARCH,
            TYPE.INDEX_PATTERN
        ].map((t) => (
            <List.Item key={t}>
                <List.Header>{TYPE_TRANSLATION[t]}</List.Header>
                <List.List>{
                    parts.nodes.filter((n) => n.type === t)
                        .sort(ObjectList.objectTitleComparator)
                        .map((n) => ((
                            <List.Item key={n.id}>
                                <List.Header>{n.title}</List.Header>
                                <List.Description>{n.id}</List.Description>
                            </List.Item>
                        )))
                }</List.List>
            </List.Item>
        ));

        return (
            <List>{stats}</List>
        );
    }
}

/* Author: Sol Eun

*/

var nodes = [];
var links = [];
var nodes_hash = {};

$(document).ready(function () {
    $('div#main').layout({
        applyDefaultStyles: false,
        east__closable: false,
        east__resisable: false,
        east__slidable: false,
        east__spacing_open: 0,
        east__size: 350,
        north__closable: false,
        north__resisable: false,
        north__slidable: false,
        north__spacing_open: 0,
        north__size: 74,
        south__closable: false,
        south__resisable: false,
        south__slidable: false,
        south__spacing_open: 0,
        south__size: 30
    });
    init();
});

function init() {
    var width = $('div#main').layout().state.center.innerWidth,
        height = $('div#main').layout().state.center.innerHeight,
        root, svg;

    var color = d3.scale.category20();

    var force = d3.layout.force().charge(-200).linkDistance(50).size([width, height]);

    //loadGraph("jacomyal", "sigma.js");
    function loadGraph(user, repo) {
        if (svg) {
            svg.remove();
        }
        if (!$("#append").prop("checked")) {
            nodes = [];
            links = [];
            nodes_hash = {};
        }

        svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);

        root = addNode({
            "name": repo,
            "type": "project",
            "x": width / 2,
            "y": height / 2,
            "group": 0
        });
        fetchGraph(user, repo, root, 1);
    }

    function fetchGraph(user, repo, root_id, page) {
        var node_idx;
        //if(page > 0) {
        d3.json("https://api.github.com/repos/" + user + "/" + repo + "/forks?callback=?&per_page=100&page=" + page, function (data) {
            if (data && data.length > 0) {
                console.debug(data);
                $.each(data, function (i, o) {
                    node_idx = addNode({
                        "name": o['owner']['login'],
                        "type": "user",
                        "x": width / 2,
                        "y": height / 2,
                        "group": 2
                    });
                    links.push({
                        "source": root_id,
                        "target": node_idx,
                        "value": 1
                    });
                });
                /*
                 * Loading only the first page for now.
                 */
                //    fetchGraph(user, repo, root_id, ++page);
                //} else {
                //	update();
            }
            update();
        });
        //}
    }

    function addNode(o) {
        if (!nodes_hash[o['name']]) {
            nodes.push(o);
            nodes_hash[o['name']] = nodes.length - 1;
        }
        return nodes_hash[o['name']];
    }

    function getNodeIdx() {
        if (!nodes_hash[name]) {
            return -1;
        }
        return nodes_hash[name];
    }

    function update() {
        force.nodes(nodes).links(links).start();

        var link = svg.selectAll("line.link").data(links).enter().append("line").attr("class", "link").style("stroke-width", function (d) {
            return Math.sqrt(d.value);
        });

        var node = svg.selectAll("g.node").data(nodes)
        var nodeEnter = node.enter().append("svg:g").attr("class", "node").call(force.drag).on("click", click).on("mouseover.circle", function () {
            d3.select(this).select("text").style("opacity", 1)
        }).on("mouseout.circle", function () {
            d3.select(this).select("text").style("opacity", 0)
        })

        nodeEnter.append("svg:circle").attr("r", 7).style("fill", function (d) {
            return color(d.group);
        });

        nodeEnter.append("svg:text").style("pointer-events", "none").style("opacity", 0).style("z-index", 100000).attr("fill", "#555").attr("font-size", "11px").attr("dx", "8").attr("dy", ".35em").text(function (d) {
            return d.name;
        });

        nodeEnter.append("svg:title").style("pointer-events", "none").text(function (d) {
            return d.name;
        });

        force.on("tick", function () {
            link.attr("x1", function (d) {
                return d.source.x;
            }).attr("y1", function (d) {
                return d.source.y;
            }).attr("x2", function (d) {
                return d.target.x;
            }).attr("y2", function (d) {
                return d.target.y;
            });

            nodeEnter.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        });
    }

    // Toggle children on click.
    function click(d) {
        $.getJSON('https://api.github.com/users/' + d.name, function (p) {
            $('div.ui-layout-east').html('<img src="' + p.avatar_url + '"/><h2>' + p.login + '</h2>');
        });
    }

    $('.typeahead').typeahead({
        source: function (typeahead, query) {
            $.getJSON('https://github.com/api/v2/json/repos/search/' + query + '?callback=?', function (data) {
                var result_list = [];
                console.debug(data);
                $.each(data['repositories'], function (i, o) {
                    result_list.push({
                        "name": o['name'],
                        "user": o['owner'],
                        "forks": o['forks']
                    });
                });
                return typeahead.process(result_list);
            });
        },
        property: "name",
        onselect: function (obj) {
            if (obj['forks'] > 100) {
                $('#myModal').modal();
            } else {
                loadGraph(obj['user'], obj['name']);
            }
        }
    });
}
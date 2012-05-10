/* Author: Sol Eun

*/

var nodes = [];
var links = [];
var nodes_hash = {};
var links_hash = {};
var selected_node;
var node_original_color;
var max_p_size = 0;
var max_u_size = 0;
var nodes_index = 0;
var links_index = 0;
var force;
var color;
var search_hash = {};
var search_result = "";
var width, height, root, svg;

$(document).ready(function () {
    $('div#main').layout({
        applyDefaultStyles: false,
        east__closable: false,
        east__resisable: false,
        east__slidable: false,
        east__spacing_open: 0,
        east__size: 400,
        north__closable: false,
        north__resisable: false,
        north__slidable: false,
        north__spacing_open: 0,
        north__size: 79,
        south__closable: false,
        south__resisable: false,
        south__slidable: false,
        south__spacing_open: 0,
        south__size: 30
    });
    
    /*$(document).keypress(function(event){
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode == '13'){
			hideModals();
		}
	});*/

    $.urlParam = function(name){
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if(results) {
        	return results[1];
        }
        return 0;
    }
    
    $("#aboutBtn").click(function() {
		$('#aboutModal').modal('show');
	});

    $("#getstaticurl").click(function() {
    	var url = window.location.protocol+"//"+window.location.hostname+window.location.pathname;
    	if(search_result != "") {
    		url += "?defaults="+search_result;
    	}
        
        $('#urlholder').html('<textarea class="input-xlarge" id="textarea" rows="3" style="width:500px;">'+url+'</textarea>')
        $('#urlModal').modal('show');
    });
	
	$("#cleargraph").click(function() {
		clearGraph();
	});
	
	$("#east_container").css("height", $('div#main').layout().state.center.innerHeight-60);
	
	function hideModals() {
		$('#aboutModal').modal('hide');
		$('#warningModal').modal('hide');
	}

    function addSearchHash(q) {
        if(search_hash[q] == null) {
            search_hash[q] = 1;
            if(search_result == "") {
                search_result = q;
            } else {
                search_result += ","+q;
            }
        }
    }
	
	
	width = $('div#main').layout().state.center.innerWidth;
    height = $('div#main').layout().state.center.innerHeight;
        
    svg = d3.select("#chart").append("svg").attr("width", width).attr("height", height);
    
    color = d3.scale.category20();

    force = d3.layout.force().charge(-100).linkDistance(30).size([width, height]);
    
    function clearSVG() {
    	svg.selectAll("line").remove();
	    svg.selectAll("g").remove();
    }
    
    function clearGraph() {
    	nodes = [];
        links = [];
        nodes_hash = {};
        links_hash = {};
        max_p_size = 0;
        max_u_size = 0;
        nodes_index = 0;
		links_index = 0;
        search_hash = {};
		search_result = "";
		selected_node = null;
		node_original_color = null;
		        
        clearSVG();
    }

    function loadProjectGraph(obj) {
        clearSVG();
		
		obj['type'] = "project";
		obj['x'] = width / 2;
		obj['y'] = height / 2;
		obj['group'] = 0;
        obj['search'] = true;
		obj['size'] = obj['watchers'];
		
        root = addNode(obj);

        user_node_idx = addNode({
            "full_name": obj['user'],
            "name": obj['user'],
            "type": "user",
            "search": false,
            "size": 10,
            "x": width / 2,
            "y": height / 2,
            "group": 3
        });
        addLink(root, user_node_idx, 1);
        
        fetchProject(obj['user'], obj['name'], root, 1);
    }

    function loadUserGraph(user) {
        clearSVG();

        root = addNode({
            "full_name": user,
            "name": user,
            "type": "user",
            "search": true,
            "size": 10,
            "x": width / 2,
            "y": height / 2,
            "group": 3
        });
        
        fetchUser(user, root, 1);
    }

    function fetchProject(user, repo, root_id, page) {
        var fork_node_idx, user_node_idx;
        //if(page > 0) {
        $.getJSON("https://api.github.com/repos/" + user + "/" + repo + "/forks?callback=?&sort=watchers&per_page=100&page=" + page, function (data) {
            if (data && data['data'] && data['data'].length > 0) {
                $.each(data['data'], function (i, o) {

                    o["full_name"] = o['owner']['login']+"/"+o['name'];
                    o["type"] = "project";
                    o["search"] = false;
                    o["size"] = o['forks'];
                    o["url"] = o['html_url'];
                    o["x"] = width / 2;
                    o["y"] = height / 2;
                    o["group"] = 2;

                    // Fork node
                    fork_node_idx = addNode(o);
                    addLink(root_id, fork_node_idx, 1);

                    // User node
                    user_node_idx = addNode({
                        "full_name": o['owner']['login'],
                        "name": o['owner']['login'],
                        "type": "user",
                        "search": false,
                        "size": 10,
                        "x": width / 2,
                        "y": height / 2,
                        "group": 3
                    });
                    addLink(fork_node_idx, user_node_idx, 1);
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

    function fetchUser(user, root_id, page) {
        var fork_node_idx, user_node_idx;
        //if(page > 0) {
        $.getJSON("https://api.github.com/users/" + user + "/repos?callback=?&per_page=100&page=" + page, function (data) {
            if (data && data['data'] && data['data'].length > 0) {
                $.each(data['data'], function (i, o) {

                    o["full_name"] = user+"/"+o['name'];
                    o["type"] = "project";
                    o["search"] = false;
                    o["size"] = o['forks'];
                    o["url"] = o['html_url'];
                    o["x"] = width / 2;
                    o["y"] = height / 2;
                    o["group"] = 2;

                    // Fork node
                    fork_node_idx = addNode(o);
                    addLink(root_id, fork_node_idx, 1);
                });
                /*
                 * Loading only the first page for now.
                 */
                //    fetchGraph(user, repo, root_id, ++page);
                //} else {
                //  update();
            }
            update();
        });
        //}
    }

    function addNode(o) {
        if (nodes_hash[o['full_name']] == null) {
            if(!o['search']) {
                if(o['type'] == "project" && o['size'] > max_p_size) {
                    max_p_size = o['size'];
                }
                if(o['type'] == "user" && o['size'] > max_u_size) {
                    max_u_size = o['size'];
                }
            }
            nodes.push(o);
            nodes_hash[o['full_name']] = nodes_index;
            nodes_index++;
        }

        return nodes_hash[o['full_name']];
    }

    function addLink(source, target, value) {
        if (links_hash[source+"_"+target] == null) {
            links.push({
                "source": source,
                "target": target,
                "value": value
            })
            links_hash[source+"_"+target] = links_index;
            links_index++;
        }
    }

    function getNodeIdx(name) {
        if (nodes_hash[name] == null) {
            return -1;
        }
        return nodes_hash[name];
    }

    function update() {
        force.nodes(nodes).links(links).start();

        var link = svg.selectAll("line.link").data(links);
        link.enter().insert("svg:line", "g.node").attr("class", "link").style("stroke-width", function (d) {
            return Math.sqrt(d.value);
        });

        link.exit().remove();

        var node = svg.selectAll("g.node").data(nodes)
        var nodeEnter = node.enter().append("svg:g").attr("class", "node").call(force.drag).on("dblclick", doubleclickNode).on("click", clickNode).on("mouseover.circle", function () {
            d3.select(this).select("text").style("opacity", 1)
        }).on("mouseout.circle", function (d) {
            if(!d.search) {
                d3.select(this).select("text").style("opacity", 0)
            }
        })

        nodeEnter.append("svg:circle").attr("r", function (d) {
        	if(d.search) {
        		return 15;
        	}
            if(d.type == "project") {
                if(d.size/max_p_size > 0) {
                    return d.size/max_p_size*10+4;
                }
                return 5;
            } else {
                return 7;
            }
        	
        }).style("fill", function (d) {
        	if(d.type == "project") {
                if(d.search) {
                    return "#1f77b4";
                } else {
                    return "#aec7e8";
                }
        	} else {
                if(d.search) {
                    return "#2ca02c";
                } else {
                    return "#98df8a";
                }
        	}
        });

        nodeEnter.append("svg:text").style("pointer-events", "none").style("z-index", 100000).attr("fill", "#555").attr("font-size", "11px").attr("dx", "8").attr("dy", ".35em").text(function (d) {
            return d.full_name;
        }).style("opacity", function(d) {
            if(!d.search) {
                return 0;
            } else {
                return 1;
            }
        });

        nodeEnter.append("svg:title").style("pointer-events", "none").text(function (d) {
            return d.full_name;
        });

        node.exit().remove();

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

            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        });
    }

    function clickNode(d, i) {
    	if(selected_node && d3.select(this).select("circle") != selected_node) {
    		selected_node.style("fill", node_original_color);
    	}
    	selected_node = d3.select(this).select("circle");
        node_original_color = selected_node.style("fill");
		selected_node.style("fill", "#d62728");
    	
    	if(d.type == "user") {
    		$.getJSON('https://api.github.com/users/' + d.name + '?callback=?', function (p) {
	            $('div#east_container').html(loadUserTemplate(p));
	        });
    	} else {
    		$('div#east_container').html(loadProjectTemplate(d));
    	}
    }

    function doubleclickNode(d, i) {
        if(selected_node && d3.select(this).select("circle") != selected_node) {
            selected_node.style("fill", node_original_color);
        }
        selected_node = d3.select(this).select("circle");
        selected_node.attr("r", 15);
        selected_node.style("fill", "#d62728"); 

        nodes[nodes_hash[d.full_name]]["search"] = true;
        
        if(d.type == "user") {
            $.getJSON('https://api.github.com/users/' + d.name + '?callback=?', function (p) {
                $('div#east_container').html(loadUserTemplate(p));
            });
            node_original_color = "#2ca02c";
            addSearchHash("u:"+d.name);
            fetchUser(d.name, i, 1);
        } else {
            $('div#east_container').html(loadProjectTemplate(d));
            node_original_color = "#1f77b4";
            addSearchHash("p:"+d['owner']['login']+":"+d.name);
            fetchProject(d['owner']['login'], d.name, i, 1);
        }
    }
    
    function loadProjectTemplate(d) {
    	var returnString = '\
    	<h2>\
    		<span>' + d.full_name + '</span>\
    	</h2>\
    	<br/>\
    	<form id="right_panel" class="form-horizontal">\
    		<fieldset>';
    	
    	if(d.language) {
    		returnString += '<div class="control-group"><label class="control-label">Language</label><div class="controls">'+ d.language +'</div></div>';
    	}
    	
    	returnString += '<div class="control-group"><label class="control-label">GitHub URL</label><div class="controls"><a href="'+d.url+'" target="_blank">'+ d.url +'</a></div></div>';
    	
    	if(d.forks) {
    		returnString += '<div class="control-group"><label class="control-label">Forks</label><div class="controls">'+ d.forks +'</div></div>';
    	}
    	if(d.watchers) {
    		returnString += '<div class="control-group"><label class="control-label">Watchers</label><div class="controls">'+ d.watchers +'</div></div>';
    	}
    	if(d.open_issues) {
    		returnString += '<div class="control-group"><label class="control-label">Open Issues</label><div class="controls">'+ d.open_issues +'</div></div>';
    	}
    	if(d.description) {
    		returnString += '<div class="control-group"><label class="control-label">Description</label><div class="controls">'+ d.description +'</div></div>';
    	}
    	
    	returnString +=	'</fieldset>\
    	</form>';
    	
    	return returnString;
    }
    
    function loadUserTemplate(p) {
    	var returnString = '\
    	<h2>\
    		<img width="48" height ="48" src="' + p['data'].avatar_url + '"/> \
    		<span>' + p['data'].login + '</span>\
    	</h2>\
    	<br/>\
    	<form id="right_panel" class="form-horizontal">\
    		<fieldset>';
    	
    	returnString += '<div class="control-group"><label class="control-label">Hireable?</label><div class="controls">';
    	if(p['data'].hireable != null) {
	    	if(p['data'].hireable == true) {
	    		returnString += '<button class="btn btn-mini btn-success disabled">Hireable!</button>';
	    	} else {
	    		returnString += '<button class="btn btn-mini btn-danger disabled">Not Hireable</button>';
	    	}
	    } else {
	    	returnString += '<button class="btn btn-mini disabled">Unknown</button>';
	    }
	    returnString += '</div></div>';
    	
    	if(p['data'].company) {
    		returnString += '<div class="control-group"><label class="control-label">Company</label><div class="controls">'+ p['data'].company +'</div></div>';
    	}
    	if(p['data'].location) {
    		returnString += '<div class="control-group"><label class="control-label">Location</label><div class="controls">'+ p['data'].location +'</div></div>';
    	}
    	
    	returnString += '<div class="control-group"><label class="control-label">GitHub URL</label><div class="controls"><a href="'+p['data'].html_url+'" target="_blank">'+ p['data'].html_url +'</a></div></div>';
    	
    	if(p['data'].blog) {
    		returnString += '<div class="control-group"><label class="control-label">Website</label><div class="controls"><a href="'+p['data'].blog+'" target="_blank">'+ p['data'].blog +'</a></div></div>';
    	}
    	if(p['data'].followers) {
    		returnString += '<div class="control-group"><label class="control-label">Followers</label><div class="controls">'+ p['data'].followers +'</div></div>';
    	}
    	if(p['data'].following) {
    		returnString += '<div class="control-group"><label class="control-label">Following</label><div class="controls">'+ p['data'].following +'</div></div>';
    	}
    	if(p['data'].public_gists) {
    		returnString += '<div class="control-group"><label class="control-label">Public Gists</label><div class="controls">'+ p['data'].public_gists +'</div></div>';
    	}
    	if(p['data'].bio) {
    		returnString += '<div class="control-group"><label class="control-label">Bio</label><div class="controls">'+ p['data'].bio +'</div></div>';
    	}
    	
    	returnString +=	'</fieldset></form>';
    	
    	return returnString;
    }

    function fetchRepo(user, repo) {
        $.getJSON("https://api.github.com/repos/" + user + "/" + repo + "?callback=?", function (data) {
            if (data && data['data']) {
                var o = data['data'];
                if (o['forks'] > 100) {
                    $('#warningModal').modal();
                }
                loadProjectGraph({
                    "full_name": o['owner']['login']+"/"+o['name'],
                    "name": o['name'],
                    "user": o['owner']['login'],
                    "forks": o['forks'],
                    "watchers": o['watchers'],
                    "description": o['description'],
                    "url": o['html_url'],
                    "language": o['language']
                });
            }
        });
    }

    if($.urlParam("defaults")) {
        default_repos = $.urlParam("defaults").split(",");

        $.each(default_repos, function (i, o) {
            var details = o.split(":");
            if(details[0] == "p") {
                fetchRepo(details[1], details[2]);
            } else {
                loadUserGraph(details[1]);
            }
            addSearchHash(o);
        });
    }

    $('.typeahead').typeahead({
        source: function (typeahead, query) {
            $.getJSON('https://github.com/api/v2/json/repos/search/' + query + '?callback=?', function (data) {
                var result_list = [];
                $.each(data['repositories'], function (i, o) {
                    result_list.push({
                        "full_name": o['owner']+"/"+o['name'],
                        "name": o['name'],
                        "user": o['owner'],
                        "forks": o['forks'],
                        "watchers": o['watchers'],
                        "description": o['description'],
                        "url": o['url'],
                        "language": o['language']
                    });
                });
                return typeahead.process(result_list);
            });
        },
        property: "name",
        onselect: function (obj) {
            if (obj['forks'] > 100) {
                $('#warningModal').modal();
                $('#warningModal > .modal-footer > a').focus();
            }
            addSearchHash("p:"+obj['user']+":"+obj['name']);
            loadProjectGraph(obj);
        }
    });
});
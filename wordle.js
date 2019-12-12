

// 读取json文件
d3.json("./data/wordle-info.json", function(data){

    total_links = data.links;
    total_nodes = data.nodes;

    // nodes = total_nodes;
    // links = total_links;

    nodes = [{"node_id": "paper-2001-45", "node_name": "Human tracking in multiple cameras", "node_cite": 110}, {"node_id": "author-S. Khan", "node_name": "S. Khan"}];
    links = [{"source": "author-S. Khan", "target": "paper-2001-45"}];

    // console.log(nodes);
    rela_p2a = data.rela_p2a;
    rela_a2p = data.rela_a2p;

    // FDG_init();
    // showForce();
});
import json
import os

# 节点信息
nodes = []
# 链接信息
links = []
# author to paper
rela_a2p = {}
# paper to author
rela_p2a = {}

def parse_dir(datapath):
    infos = json.load(open("./organized/" + datapath))
    year = datapath[4: 8]
    for info in infos:
        if not info:
            continue

        node = {}
        # 使用索引来找到a2p p2a关系
        idx = len(nodes)
        try:
            paper_id = "paper" + "-" + year + "-" + str(info['id'])
        except:
            print(info)
        # 添加 paper 信息
        node['node_id'] = paper_id
        node['node_name'] = info['title']
        node['node_cite'] = sum(info['citation'].values())
        nodes.append(node.copy())
        for author in info['authors']:
            node = {}
            author_id = "author" + "-" + author
            node['node_id'] = author_id
            node['node_name'] = author
            nodes.append(node.copy())

            link = {}
            link['source'] = author_id
            link['target'] = paper_id
            links.append(link.copy())

            # 使用nodes的索引来保存关系
            if author not in rela_a2p:
                rela_a2p[author] = []
            rela_a2p[author].append(idx)
            if info['title'] not in rela_p2a:
                rela_p2a[info['title']] = []
            rela_p2a[info['title']].append(len(nodes) - 1)

if __name__ == '__main__':
    dir_name = sorted(os.listdir('./organized'))
    for name in dir_name:
        if name.endswith('.json'):
            parse_dir(name)
            print("process finish : ", name)
            # break

    # parse_dir('iccv2015_paper_infos.json')

    info = {}
    info['nodes'] = nodes
    info['links'] = links
    info['rela_a2p'] = rela_a2p
    info['rela_p2a'] = rela_p2a

    json.dump(info, open('FDG-info.json', "w"));

    # # author 有6471人
    # print(len(info['rela_a2p'].keys()))
    # # paper 有3277篇
    # print(len(info['rela_p2a'].keys()))
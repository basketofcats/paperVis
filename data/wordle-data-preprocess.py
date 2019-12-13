import json
import os
from collections import *

# 关键词信息
keywords_cnt = {}

def parse_dir(datapath):
    infos = json.load(open("./organized/" + datapath))
    year = datapath[4: 8]
    t = set()
    for info in infos:
        if not info:
            continue
        t.clear()
        for conference in info['keywords'].keys():
            for keyword in info['keywords'][conference]:
                t.add(keyword.title())
        for s in t:
            if s not in keywords_cnt:
                keywords_cnt[s] = 0
            keywords_cnt[s] += 1

def word_filter(key_cnt):
    # removelist去掉无关但是频率较高的词语
    removelist = ["秒拍", "视频", "网页", "分享", "全文", "链接"]
    for word in removelist:
        try:
            del key_cnt[word]
            print("delet", word)
        except Exception:
            pass

def parse_file(filename):
    parse_dir(filename)
    print("process finish : ", filename)
    count = Counter(keywords_cnt)
    rank = count.most_common()[:50]

    info = []
    m = {}
    for items in rank:
        m.clear()
        m["text"] = items[0]
        m["size"] = items[1]
        info.append(m.copy())

    to_file = "wordle-info-" + filename[4: 8] + ".json"
    json.dump(info, open(to_file, "w"));

if __name__ == '__main__':
    dir_name = sorted(os.listdir('./organized'))
    for name in dir_name:
        if name.endswith('.json'):
            keywords_cnt.clear()
            parse_file(name)
            # parse_dir(name)
            # print("process finish : ", name)
            # break

    # parse_dir('iccv2015_paper_infos.json')

    # count = Counter(keywords_cnt)
    # rank = count.most_common()[:50]
    #
    # info = []
    # m = {}
    #
    # for items in rank:
    #     # m = []
    #     # m.append(items[0])
    #     # m.append(items[1])
    #     m.clear()
    #     m["text"] = items[0]
    #     m["size"] = items[1]
    #     info.append(m.copy())
    #
    # json.dump(info, open('wordle-info.json', "w"))

    # # author 有6471人
    # print(len(info['rela_a2p'].keys()))
    # # paper 有3277篇
    # print(len(info['rela_p2a'].keys()))
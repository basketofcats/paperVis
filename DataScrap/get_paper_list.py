"""
爬取豆瓣电影Top250
"""

import os
import re
import time
import requests
import json
from bs4 import BeautifulSoup


def download_iccv(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 SE 2.X MetaSr 1.0"
        }
    print(f"正在爬取：{url}")
    html = requests.get(url, headers=headers).text 

    soup = BeautifulSoup(html, 'html.parser')
    lis = soup.find_all("li",class_="entry inproceedings")

    all_papers = []

    for li in lis:
        link_tag = li.select_one('a')
        link = link_tag['href']

        article = li.find(class_='data')

        title_tag = article.find('span',class_='title')
        title = title_tag.text

        authors_tag = article.find_all('a')

        if len(authors_tag) == 0:
            continue

        authors = []
        for s in authors_tag:
            authors.append(s.text)

        all_papers.append({'title': title, 'link': link, 'authors': authors})

    #with open('./data/iccv2017.json','w',encoding='utf-8') as fp:
    #    json.dump(all_papers,fp=fp,indent=4)
    
    return all_papers



def main():
    year = ['2017','2015','2013','2011','2009','2007']
    url = 'https://dblp.uni-trier.de/db/conf/iccv/iccv%s.html'

    all_year_papers = {}
    
    for y in year:
        p = download_iccv(url % y)
        all_year_papers['%s' % y] = p
        print('%s: %d' % (y,len(p)))

    two_volume_year = ['2005','2003','2001']
    url1 = 'https://dblp.uni-trier.de/db/conf/iccv/iccv%s-1.html'
    url2 = 'https://dblp.uni-trier.de/db/conf/iccv/iccv%s-2.html'
    for y in two_volume_year:
        p1 = download_iccv(url1 % y)
        p2 = download_iccv(url2 % y)
        p = p1 + p2
        all_year_papers['%s' % y] = p
        print('%s: %d' % (y,len(p)))

    with open('./data/iccv_papers.json','w', encoding='utf-8') as fp:
        json.dump(all_year_papers,fp=fp,indent=4)

    print("爬取完毕。")


if __name__ == '__main__':
    main()

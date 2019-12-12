import os
import re
import time
import requests
import json
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

WAIT_TiME = 15

import traceback

def download_paper_info(url, driver):
    try:
        # 操作这个对象.
        driver.get(url)  

        true_url = driver.current_url   
        print(true_url)       # 打印加载的page code, 证明(prove) program is right.

        #title & authors

        title_h1 = WebDriverWait(driver, WAIT_TiME).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'document-title'))
        )
        title = title_h1.text

        '''
        authors_span = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, 'authors-info'))
        )
        authors = []
        for author_sp in authors_span:
            au = author_sp.find_element_by_tag_name('a').text
            #if (au[-1] == ';'):
            #    au = au[:-2]
            authors.append(au)
        
        #print(title)
        print(authors)
        '''

        #abstract

        abstract_div = WebDriverWait(driver, WAIT_TiME).until(
            EC.presence_of_element_located((By.CLASS_NAME, "document-abstract"))
        )
        abstract_div = abstract_div.find_element_by_class_name('abstract-desktop-div')
        abstract_div = abstract_div.find_element_by_class_name('u-mb-1')
        abstract_div = abstract_div.find_element_by_tag_name('div')
        abstract = abstract_div.text

        # find tabs
        tabs = WebDriverWait(driver, WAIT_TiME).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, 'browse-pub-tab'))
        )

        authors_tab = None
        reference_tab = None
        citation_tab = None
        keywords_tab = None

        # 1,3,4,5
        for i in range(1,6):
            current_tab = tabs[i].find_element_by_tag_name('a')
            if current_tab.text == 'Authors':
                authors_tab = current_tab
            elif current_tab.text == 'References':
                reference_tab = current_tab
            elif current_tab.text == 'Citations':
                citation_tab = current_tab
            elif current_tab.text == 'Keywords':
                keywords_tab = current_tab
                break
        
        #authors
        authors = []
        
        if authors_tab is not None:
            js1="document.documentElement.scrollTop=%d-100" % authors_tab.location['y']
            driver.execute_script(js1)
            authors_tab.click()

            authors_div = WebDriverWait(driver, WAIT_TiME).until(
                EC.presence_of_all_elements_located((By.XPATH, '//div[@class=\'container-active\']//div[@class=\'authors-accordion-container\']'))
            )

            for author_d in authors_div:
                au = author_d.find_element_by_tag_name('a').text
                authors.append(au)
            #print(authors)

        
        #reference
        reference_list = []
        
        if reference_tab is not None:
            js1="document.documentElement.scrollTop=%d-100" % reference_tab.location['y']
            driver.execute_script(js1)
            reference_tab.click()

            reference_div = WebDriverWait(driver, WAIT_TiME).until(
                EC.presence_of_element_located((By.XPATH, '//div[@class=\'container-active\']//div[@id=\'references-section-container\']'))
            )
            reference_div = reference_div.find_elements_by_class_name('reference-container')
            #print( 'reference count: %d' % len(reference_div) )

            for refer_div in reference_div:
                spans = refer_div.find_elements_by_tag_name('span')
                spans = spans[1]
                ref_info = spans.text
                ref_info_list = ref_info.split('\"')

                if len(ref_info_list) > 1:
                    ref_authors = ref_info_list[0].rstrip(', ')
                    ref_title = ref_info_list[1].strip()
                    ref_conference = ref_info_list[2].lstrip(', ')
                    ref_year = re.search(r'([ \.])([1-2][0-9][0-9][0-9])([ \.])', ref_conference)
                    if ref_year:
                        ref_year = ref_year.group(2)
                    else:
                        ref_year = 'unknown'

                    reference_list.append({
                        'title':ref_title,
                        'authors': ref_authors,
                        'conference': ref_conference,
                        'ref_year': ref_year,
                    })
                else:
                    reference_list.append({
                        'title': ref_info,
                        'authors': 'unknown',
                        'conference': 'book',
                        'ref_year': 'unknown',
                    })
            #print(reference_list)

        # citation count
        citation_ieee = 0
        citation_other = 0
        citation_total = 0
        if citation_tab is not None:
            js1="document.documentElement.scrollTop=%d-100" % citation_tab.location['y']
            driver.execute_script(js1)
            citation_tab.click()
            #print(driver.current_url)


            citation_div = WebDriverWait(driver, WAIT_TiME).until(
                EC.presence_of_element_located((By.XPATH, '//div[@class=\'container-active\']//div[@id=\'citations-section-container\']'))
            )
            citation_div = citation_div.find_element_by_class_name('hide-mobile')
            #print(citation_div.text)

            citation_list = re.split('[()]',citation_div.text)
            citation_ieee = int(citation_list[1])
            citation_other = int(citation_list[3])
            citation_total = citation_ieee + citation_other
            #print(citation_ieee, citation_other)


        #keywords

        keywords = {}

        if keywords_tab is not None:
            js1="document.documentElement.scrollTop=%d-100" % keywords_tab.location['y']
            driver.execute_script(js1)
            keywords_tab.click()
            #print(driver.current_url)

            keywords_div = WebDriverWait(driver, WAIT_TiME).until(
                EC.presence_of_element_located((By.XPATH, '//div[@class=\'container-active\']//div[@class=\'stats-keywords-container\']'))
            )
            keywords_div = keywords_div.find_elements_by_class_name('doc-keywords-list-item')

            for keywords_d in keywords_div:
                keywords_type = keywords_d.find_element_by_tag_name('strong').text
                keywords_a = keywords_d.find_elements_by_tag_name('a')
                keyword_one = []
                for keyw in keywords_a:
                    keyword_one.append(keyw.text)

                keywords[keywords_type] = keyword_one
    except:
        #traceback.print_exc()
        return None
    
    return {
        'title': title,
        'authors': authors,
        'abstract': abstract,
        'ieee_link': true_url,
        'reference_list': reference_list,
        'citation': {
            'ieee' : citation_ieee,
            'other': citation_other,
            'total': citation_total 
        },
        'keywords': keywords
    }


RETRY_TIMES = 3

def main():

    chrome_opt = Options()      # 创建参数设置对象.
    prefs = {
        'profile.default_content_setting_values' : {
            'images' : 2
        }
    }
    chrome_opt.add_experimental_option('prefs',prefs)
    chrome_opt.add_argument('--headless')   # 无界面化.
    chrome_opt.add_argument('--disable-gpu')    # 配合上面的无界面化.
    chrome_opt.add_argument('--window-size=1366,768')   # 设置窗口大小, 窗口大小会有影响.

    driver = webdriver.Chrome(chrome_options=chrome_opt)     # 创建Chrome对象.


    #year = ['2017']#,
    year = ['2015']#,'2013','2011','2009','2007','2005','2003'] #,'2001']

    all_year_paper = '' 
    with open('./data/iccv_papers.json','r', encoding='utf-8') as fp:
        all_year_paper = json.load(fp=fp)


    #paper_info = download_paper_info(paper[8]['link'], driver)
    #print(paper_info)

    #'''
    for y in year:
        paper = all_year_paper[y]

        print('processing year %s' % y)

        year_info = []
        missing_info = []

        year_count = len(paper)

        for v,p in enumerate(paper):
            for i in range(RETRY_TIMES):
                paper_info = download_paper_info(p['link'], driver)

                if paper_info is not None:
                    year_info.append(paper_info)
                    print('finished %d of %d' % (v+1, year_count))
                    break
                else:
                    if i == RETRY_TIMES - 1:
                        missing_info.append(v)
                        year_info.append({})
                        print('failed %d' % (v+1))
                    else:
                        time.sleep(2)
                        print('failed, retrying in 2 secs')
            
        with open('./data/raw/iccv%s_paper_infos.json' % y, 'w', encoding='utf-8') as fp:
            json.dump(year_info,fp=fp,indent=4)

        with open('./data/raw/iccv%s_missing_infos.json' % y, 'w', encoding='utf-8') as fp:
            json.dump(missing_info,fp=fp,indent=4)
    #'''

    driver.quit()   # 使用完, 记得关闭浏览器, 不然chromedriver.exe进程为一直在内存中.

def fix():
    chrome_opt = Options()      # 创建参数设置对象.
    prefs = {
        'profile.default_content_setting_values' : {
            'images' : 2
        }
    }
    chrome_opt.add_experimental_option('prefs',prefs)
    chrome_opt.add_argument('--headless')   # 无界面化.
    chrome_opt.add_argument('--disable-gpu')    # 配合上面的无界面化.
    chrome_opt.add_argument('--window-size=1366,768')   # 设置窗口大小, 窗口大小会有影响.

    driver = webdriver.Chrome(chrome_options=chrome_opt)     # 创建Chrome对象.


    year = ['2017','2015','2013','2011','2009','2007','2005','2003','2001']

    all_year_paper = '' 
    with open('./data/iccv_papers.json','r', encoding='utf-8') as fp:
        all_year_paper = json.load(fp=fp)



    #'''
    for y in year:
        paper = all_year_paper[y]

        print('fixing year %s' % y)

        year_info = []
        with open('./data/raw/iccv%s_paper_infos.json' % y, 'r', encoding='utf-8') as fp:
            year_info = json.load(fp=fp)
        missing_info = []
        with open('./data/raw/iccv%s_missing_infos.json' % y, 'r', encoding='utf-8') as fp:
            missing_info = json.load(fp=fp)

        still_missing_info = []

        for missing_index in missing_info:
            for i in range(RETRY_TIMES):
                paper_info = download_paper_info(paper[missing_index]['link'], driver)

                if paper_info is not None:
                    year_info[missing_index] = paper_info
                    print('finished %d!' % (missing_index))
                    break
                else:
                    if i == RETRY_TIMES - 1:
                        still_missing_info.append(missing_index)
                        print('failed %d' % (missing_index))
                    else:
                        time.sleep(2)
                        print('failed, retrying in 2 secs')
            
        with open('./data/raw/iccv%s_paper_infos.json' % y, 'w', encoding='utf-8') as fp:
            json.dump(year_info,fp=fp,indent=4)

        with open('./data/raw/iccv%s_missing_infos.json' % y, 'w', encoding='utf-8') as fp:
            json.dump(still_missing_info,fp=fp,indent=4)
    #'''

    driver.quit()   # 使用完, 记得关闭浏览器, 不然chromedriver.exe进程为一直在内存中.

def test():
    chrome_opt = Options()      # 创建参数设置对象.
    prefs = {
        'profile.default_content_setting_values' : {
            'images' : 2
        }
    }
    chrome_opt.add_experimental_option('prefs',prefs)
    chrome_opt.add_argument('--headless')   # 无界面化.
    chrome_opt.add_argument('--disable-gpu')    # 配合上面的无界面化.
    chrome_opt.add_argument('--window-size=1366,768')   # 设置窗口大小, 窗口大小会有影响.

    driver = webdriver.Chrome(chrome_options=chrome_opt)     # 创建Chrome对象.
    url = 'https://doi.org/10.1109/ICCV.2017.499'
    paper_info = download_paper_info(url, driver)

    driver.quit()   # 使用完, 记得关闭浏览器, 不然chromedriver.exe进程为一直在内存中.


import sys

if __name__ == '__main__':
    if len(sys.argv) == 1:
        main()
    elif sys.argv[1] == 'fix':
        fix()
    elif sys.argv[1] == 'test':
        test()
    else:
        pass

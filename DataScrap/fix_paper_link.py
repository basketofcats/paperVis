import os
import re
import time
import requests
import json

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

WAIT_TiME = 15

if __name__ == '__main__':
    year = ['2017']

    all_year_paper = '' 
    with open('./data/iccv_papers.json','r', encoding='utf-8') as fp:
        all_year_paper = json.load(fp=fp)

    # fix 2017
    '''
    for v,p in enumerate(all_year_paper['2017']):
        if p['link'].startswith('http://doi.ieeecomputersociety.org/'):
            all_year_paper['2017'][v]['link'] = p['link'].replace('http://doi.ieeecomputersociety.org/','https://doi.org/')

    with open('./data/iccv_papers.json','w', encoding='utf-8') as fp:
        json.dump(all_year_paper,fp=fp,indent=4)
    '''

    # fix 2001

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
    
    print(len(all_year_paper['2001']))

    current_index = 0
    
    urls = ['https://ieeexplore.ieee.org/xpl/conhome/7460/proceeding?isnumber=20293&rowsPerPage=100','https://ieeexplore.ieee.org/xpl/conhome/7460/proceeding?rowsPerPage=100']

    for v,url in enumerate(urls):
        driver.get(url)
        print(driver.current_url)

        if v == 1:
            load_more_button = WebDriverWait(driver, WAIT_TiME).until(
                EC.presence_of_element_located((By.XPATH, "//div[@class=\'loadMore-container\']//button"))
            )

            js1="document.documentElement.scrollTop=%d-100" % load_more_button.location['y']
            driver.execute_script(js1)
            load_more_button.click()

            print('button clicked, wait for 5 secs')
            time.sleep(5)

        paper_list_divs = WebDriverWait(driver, WAIT_TiME).until(
            EC.presence_of_all_elements_located((By.XPATH, "//div[@class=\'issue-list-container col\']//div[@class=\'List-results-items\']"))
        )
        paper_list_divs = paper_list_divs[1:]
        if v == 1:
            paper_list_divs = paper_list_divs[:-1]

        if v == 0:
            print(len(paper_list_divs) + 5)
        else:
            print(len(paper_list_divs))

        for paper_div in paper_list_divs:
            paper_a = paper_div.find_element_by_tag_name('h2')
            paper_a = paper_div.find_element_by_tag_name('a')
            paper_link = paper_a.get_attribute('href')
            #print(paper_link)

            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1

        if v == 0:
            paper_link = 'https://ieeexplore.ieee.org/document/937598'
            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1
            paper_link = 'https://ieeexplore.ieee.org/document/937600'
            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1
            paper_link = 'https://ieeexplore.ieee.org/document/937601'
            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1
            paper_link = 'https://ieeexplore.ieee.org/document/937602'
            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1
            paper_link = 'https://ieeexplore.ieee.org/document/937604'
            all_year_paper['2001'][current_index]['link'] = paper_link
            current_index += 1

    with open('./data/iccv_papers.json','w', encoding='utf-8') as fp:
        json.dump(all_year_paper,fp=fp,indent=4)

    driver.quit()
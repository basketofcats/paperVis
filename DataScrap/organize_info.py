import os
import re
import time
import json


#MIN_LEN:8 MIN_STR: MAT R-CNN

def judge_cvpr(p_all):
    cvpr_matchers = [r'cvpr',r'co([a-z.]*) vi([a-z.]*) pa([a-z.]*) re([a-z.]*)',r'co([a-z.]*) vi([a-z.]*) (and) pa([a-z.]*) re([a-z.]*)']
    for matcher in cvpr_matchers:
        if re.search(matcher, p_all) is not None:
            return True
    return False
    
def judge_iccv(p_all):
    iccv_matchers = [r'iccv',r'in([a-z.]*) co([a-z.]*) co([a-z.]*) vi([a-z.]*)',r'in([a-z.]*) co([a-z.]*) on co([a-z.]*) vi([a-z.]*)']
    for matcher in iccv_matchers:
        m = re.search(matcher, p_all)
        if m is not None:
            return True, m
    return False, None

def get_title_string(raw_title):
    #replace &
    raw_title = raw_title.replace('&', 'and')

    return_str = raw_title.strip(' .').lower()
    return_str = re.split(r'[.,]\s+', return_str)[-1]
    return_str = ''.join(list(filter( str.isalnum , return_str )))[:50]
    return return_str

def main():
    year = ['2017', '2015','2013','2011','2009','2007','2005','2003','2001']

    all_year_paper = '' 
    with open('./data/iccv_papers.json','r', encoding='utf-8') as fp:
        all_year_paper = json.load(fp=fp)

    title_sets = {}
    for y in year:
        y_papers = all_year_paper[y]
        title_list = [ get_title_string(p['title']) for p in y_papers]
        y_set = dict( zip( title_list, list(range(len(y_papers))) ) )
        print(title_list[0])
        print(len(y_set))

        title_sets[y] = y_set

    test_year = year

    new_all_year_info = {}  

    blocked_cvpr_f = open('./data/organized/blocked_cvpr.txt' , 'w', encoding='utf-8')

    for y in test_year:
        with open('./data/raw/iccv%s_paper_infos.json' % y,'r', encoding='utf-8') as fp:
            y_info = json.load(fp=fp)

        not_founded_f = open('./data/organized/iccv%s_not_founded.txt' % y , 'w', encoding='utf-8' )
        founded_f = open('./data/organized/iccv%s_founded.txt' % y , 'w', encoding='utf-8')
        
        
        for p_index,p_info in enumerate(y_info):
            if not 'reference_list' in p_info:
                continue

            new_reference_list = []

            for p_ref in p_info['reference_list']:
                if p_ref['conference']!='book':
                    p_ref_conference = p_ref['conference'].lower()

                    if judge_cvpr(p_ref_conference):
                        blocked_cvpr_f.write('%s\n' % p_ref_conference)
                        continue

                    p_ref_title = get_title_string(p_ref['title'])
                    #print(p_ref_conference)

                    is_iccv, m = judge_iccv(p_ref_conference)
                    if is_iccv:
                        #already find title & conference
                        probable_years = re.findall(r'(20[0-9][0-9])', p_ref_conference)
                        
                        founded = False
                        
                        for probable_year in probable_years:
                            probable_year = probable_year
                            if (probable_year in year) and (p_ref_title in title_sets[probable_year]):
                                index_number = title_sets[probable_year][p_ref_title] 
                                new_reference_list.append({'year': probable_year, 'id': index_number})
                                founded_f.write('CONF!!! %s \ntitle: %s year: %s span:(%d,%d) \n' % (p_ref['title'] + ',' + p_ref_conference, p_ref_title, probable_years, m.span()[0], m.span()[1]))
                                founded = True
                                break
                        
                        if not founded and len(probable_years) >= 1: 
                            not_founded_f.write('CONF!!!cannot find %s \ntitle: %s year: %s span:(%d,%d) \n' % (p_ref['title'] + ',' + p_ref_conference, p_ref_title, probable_years, m.span()[0], m.span()[1])) 
                else:
                    #cannot resolve title & conference
                    p_ref_all = p_ref['title']

                    p_ref_lower = p_ref_all.lower()

                    if judge_cvpr(p_ref_lower):
                        blocked_cvpr_f.write('%s\n' % p_ref_lower)
                        continue

                    is_iccv, m = judge_iccv(p_ref_lower)
                    if is_iccv:
                        #print(p_ref_all)
                        p_ref_part = p_ref_all[ :m.span()[0] ]

                        p_ref_split_list = re.split(r'[.,]\s+',p_ref_part)

                        #find title
                        for i in range( len(p_ref_split_list)-1, -1, -1):
                            if len(p_ref_split_list[i]) >= 8 and (not 'Proc.' in p_ref_split_list[i]) and (not 'In IEEE' in p_ref_split_list[i]) :
                                p_ref_title = get_title_string(p_ref_split_list[i])
                                break
                                
                        
                        founded = False

                        probable_years = re.findall(r'(20[0-9][0-9])', p_ref_all)
                        for probable_year in probable_years:
                            probable_year = probable_year
                            if (probable_year in year) and (p_ref_title in title_sets[probable_year]):
                                index_number = title_sets[probable_year][p_ref_title] 
                                new_reference_list.append({'year': probable_year, 'id': index_number})
                                founded_f.write('BOOK!!! %s \ntitle: %s year: %s span:(%d,%d) \n' % (p_ref['title'] + ',' + p_ref_conference, p_ref_title, probable_years, m.span()[0], m.span()[1]))
                                founded = True
                                break

                        if not founded and len(probable_years) >= 1:
                            not_founded_f.write('BOOK!!!cannot find %s \ntitle: %s year: %s span:(%d,%d) \n' % (p_ref_all,p_ref_title,probable_years,m.span()[0], m.span()[1])) 

            y_info[p_index]['reference_list'] = new_reference_list

            #print(new_reference_list)

            #if (p_index == 20):
            #    break
            y_info[p_index]['id'] = p_index

            #add citation
            y_info[p_index]['cited_by'] = []
        
        new_all_year_info[y] = y_info
        not_founded_f.close()

    blocked_cvpr_f.close()

    #add citaions
    for y in test_year:
        y_info = new_all_year_info[y]

        for p_index, p_info in enumerate(y_info):
            if not p_info:
                continue

            for p_ref_info in p_info['reference_list']:
                target_year = p_ref_info['year']
                target_id = p_ref_info['id']
                
                if target_year in test_year and new_all_year_info[target_year][target_id]:
                    new_all_year_info[target_year][target_id]['cited_by'].append({
                        'year' : y,
                        'id' : p_index
                    })

    for y in test_year:
        y_info = new_all_year_info[y]
        # todo
        with open('./data/organized/iccv%s_paper_infos.json' % y,'w', encoding='utf-8') as fp:
            json.dump(y_info,fp=fp,indent=4)

    

if __name__ == '__main__':
    main()
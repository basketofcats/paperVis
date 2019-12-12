import os
import re
import time
import json

import pymongo

def create_db():
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    db = myclient["papervis"]

    year = ['2017', '2015','2013','2011','2009','2007','2005','2003','2001']

    for y in year:
        if y in db.list_collection_names():
            db[y].drop()
    
    print('cleared!')

    for y in year:
        table = db[y]

        with open('./data/organized/iccv%s_paper_infos.json' % y,'r', encoding='utf-8') as fp:
            y_info = json.load(fp=fp)

        table.insert_many(y_info)
        print('finish %s' % y)
        

    # search & test
    for x in db['2013'].find({'keywords.IEEE Keywords': 'Visualization' },{'_id':0,'title':1,'keywords.IEEE Keywords':1}):
        print(x)    
        

if __name__=='__main__':
    create_db()



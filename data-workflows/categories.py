import os
import time
import hashlib

from pynamodb.attributes import ListAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from slugify import slugify
from typing import Dict
from utils.utils import S3Client, get_current_timestamp


def get_category_model(table: str):
    class CategoryModel(Model):
        class Meta:
            region = os.environ.get('AWS_REGION', 'us-west-2')
            table_name = table

        name = UnicodeAttribute(hash_key=True)
        version_hash = UnicodeAttribute(range_key=True)
        version = UnicodeAttribute()
        formatted_name = UnicodeAttribute()
        dimension = UnicodeAttribute()
        hierarchy = ListAttribute() # List[str]
        label = UnicodeAttribute()
        last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    return CategoryModel


def hash_category(category: Dict[str, str]) -> str:
    label = category.get('label', '')
    dimension = category.get('dimension')
    hierarchy = category.get('hierarchy', [])

    h = hashlib.new('md5')
    h.update(label.encode('utf-8'))
    h.update(dimension.encode('utf-8'))

    for value in hierarchy:
        h.update(value.encode('utf-8'))

    return h.hexdigest()

def run_seed_s3_categories_workflow(table: str, bucket: str, edam_version: str):
    print(f'Seeding category data from S3 version={edam_version} bucket={bucket} table={table}')
    edam_name, version = edam_version.split(':')
    s3_path = f'category/{edam_name}/{version}.json'

    client = S3Client(bucket)
    data = client.load_json_from_s3(s3_path)

    CategoryModel = get_category_model(table)
    batch = CategoryModel.batch_write()
    start = time.perf_counter()
    count = 0

    for name, categories in data.items():
        for category in categories:
            item = CategoryModel(
                name=slugify(name),
                version_hash=f'{edam_version}:{hash_category(category)}',
                version=edam_version,
                formatted_name=name,
                dimension=category.get('dimension', ''),
                hierarchy=category.get('hierarchy', []),
                label=category.get('label', ''),
            )
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    print(f'Finished seeding category data count={count} duration={duration}ms')

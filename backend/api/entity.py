import boto3
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute, ListAttribute, MapAttribute

dynamodb = boto3.client("dynamodb")


class Entity(Model):
    date_created = UTCDateTimeAttribute()
    date_modified = UTCDateTimeAttribute()


class Plugin(Entity):
    class Meta:
        table_name = f"dynamo-integration-plugin-data"
        region = dynamodb.meta.region_name

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)
    visibility = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    description = UnicodeAttribute(null=True)
    description_text = UnicodeAttribute(null=True)
    description_content_type = UnicodeAttribute(null=True)
    authors = ListAttribute(null=True)
    license = UnicodeAttribute(null=True)
    python_version = UnicodeAttribute(null=True)
    operating_system = UnicodeAttribute(null=True)
    release_date = UTCDateTimeAttribute(null=True)
    first_released = UTCDateTimeAttribute(null=True)
    development_status = UnicodeAttribute(null=True)
    requirements = UnicodeAttribute(null=True)
    project_site = UnicodeAttribute(null=True)
    documentation = UnicodeAttribute(null=True)
    support = UnicodeAttribute(null=True)
    report_issues = UnicodeAttribute(null=True)
    twitter = UnicodeAttribute(null=True)
    code_repository = UnicodeAttribute(null=True)
    citations = MapAttribute(null=True)
    category = MapAttribute(null=True)
    category_hierarchy = MapAttribute(null=True)


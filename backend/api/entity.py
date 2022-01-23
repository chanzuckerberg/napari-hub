import os
import json
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, ListAttribute, MapAttribute


class Plugin(Model):
    class Meta:
        table_name = f'{os.getenv("DYNAMO_PREFIX")}-plugin-data'
        region = os.getenv("AWS_REGION")

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
    operating_system = ListAttribute(null=True)
    release_date = UnicodeAttribute(null=True)
    first_released = UnicodeAttribute(null=True)
    development_status = ListAttribute(null=True)
    requirements = ListAttribute(null=True)
    project_site = UnicodeAttribute(null=True)
    documentation = UnicodeAttribute(null=True)
    support = UnicodeAttribute(null=True)
    report_issues = UnicodeAttribute(null=True)
    twitter = UnicodeAttribute(null=True)
    code_repository = UnicodeAttribute(null=True)
    citations = MapAttribute(null=True)
    category = MapAttribute(null=True)
    category_hierarchy = MapAttribute(null=True)


class ExcludedPlugin(Model):
    class Meta:
        table_name = f'{os.getenv("DYNAMO_PREFIX")}-excluded-plugin'
        region = os.getenv("AWS_REGION")

    name = UnicodeAttribute(hash_key=True)
    status = UnicodeAttribute(range_key=True)


class Category(Model):
    class Meta:
        table_name = f'{os.getenv("DYNAMO_PREFIX")}-category'
        region = os.getenv("AWS_REGION")

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)
    mapping = MapAttribute()


def save_plugin_entity(name: str, metadata: dict) -> Plugin:
    plugin = Plugin(
        name=name,
        version=metadata.get("version"),
        visibility=metadata.get("visibility", 'public'),
        summary=metadata.get("summary"),
        description=metadata.get("description"),
        description_text=metadata.get("description_text"),
        description_content_type=metadata.get("description_content_type"),
        authors=metadata.get("authors"),
        license=metadata.get("license"),
        python_version=metadata.get("python_version"),
        operating_system=metadata.get("operating_system"),
        release_date=metadata.get("release_date"),
        first_released=metadata.get("first_released"),
        development_status=metadata.get("development_status"),
        requirements=metadata.get("requirements"),
        project_site=metadata.get("project_site"),
        documentation=metadata.get("documentation"),
        support=metadata.get("support"),
        report_issues=metadata.get("report_issues"),
        twitter=metadata.get("twitter"),
        code_repository=metadata.get("code_repository"),
        citations=metadata.get("citations"),
        category=metadata.get("category"),
        category_hierarchy=metadata.get("category_hierarchy")
    )
    plugin.save()
    return plugin


class MapAttributeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, MapAttribute):
            return obj.as_dict()
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

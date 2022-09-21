import os

import snowflake.connector
import boto3

ctx = snowflake.connector.connect(
    user="",
    password="",
    account="CZI-IMAGING",
    warehouse="IMAGING",
    database="IMAGING",
    schema="TEST_KLAI"
)

cursor_list = ctx.execute_string(
    "SELECT * FROM ACTIVITY_DASHBOARD_TEST_2;"
)

with open('activity_dashboard_prototype.csv', 'w') as file:
    for cursor in cursor_list:
        file.write("PROJECT,MONTH,NUM_DOWNLOADS_BY_MONTH")
        file.write('\n')
        for row in cursor:
            file.write(str(row[0]) + ',' + str(row[1]) + ',' + str(row[2]))
            file.write('\n')

with open('activity_dashboard_prototype.csv', 'r') as file:
    s3_body = file.read()

os.environ['AWS_PROFILE'] = 'sci-imaging'
client = boto3.client('s3')

client.put_object(Body=s3_body, Bucket='napari-hub-dev', Key='dev-activity-dashboard-test/activity_dashboard.csv')

#!/usr/bin/env bash
# see https://stackoverflow.com/a/44850245

mkdir -p ~/.aws

cat > ~/.aws/config << EOL
[default]
region = eu-west-1
output = json
EOL

cat > ~/.aws/credentials << EOL
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
EOL

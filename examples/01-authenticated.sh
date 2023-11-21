#! /usr/bin/env bash

# Retrieve a valid bearer token from keycloak.
token=$(curl --request POST \
   --url 'https://dev.loginproxy.gov.bc.ca/auth/realms/your-realm-name/protocol/openid-connect/token' \
   -H 'content-type: application/x-www-form-urlencoded' \
   --data grant_type=client_credentials \
   --data client_id="$CLIENT_ID" \
   --data client_secret="$CLIENT_SECRET" | jq -r '.access_token')

# The template to be rendered is base64 encoded so we can POST the info to CDOGS.
base64_encoded_template=$(base64 -i template.txt)

# This sends data to CDOGS so that our template.txt can be rendered out to file test.pdf.
curl --request POST \
   --url 'https://cdogs-dev.api.gov.bc.ca/api/v2/template/render' \
   -H "Authorization: Bearer $token" \
   -H 'content-type: application/json' \
   -o 'test.pdf' \
   --data-binary @- << EOF
{
  "data": {
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "template": {
    "encodingType": "base64",
    "fileType": "txt",
    "content": "$base64_encoded_template"
  },
  "options": {
    "convertTo": "pdf",
    "overwrite": true,
    "reportName": "{d.firstName}-{d.lastName}.pdf"
  }
}
EOF

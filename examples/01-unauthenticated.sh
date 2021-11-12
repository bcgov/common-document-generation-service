#! /usr/bin/env bash

# This sends data to CDOGS so that our template.txt can be rendered out to file test.pdf.
template_hash=$(curl -v -F template=@template.txt http://localhost:3000/api/v2/template)

echo "template_hash $template_hash"

# Response body is a template string ex.
# bffe2a344ec1f8fb4fc1a1496df4ca29277da310f64eaa8748a1888b7a2198c5

# If the template is already cached an error is returned:
# template_hash {
#   "type":"https://httpstatuses.com/405",
#   "title":"Method Not Allowed",
#   "status":405,
#   "detail":"File already cached. Hash 'bffe2a344ec1f8fb4fc1a1496df4ca29277da310f64eaa8748a1888b7a2198c5'."
# }

# This sends data to CDOGS so that our template.txt can be rendered out to file test.pdf.
curl --request POST \
   --url "http://localhost:3000/api/v2/template/$template_hash/render" \
   -H 'content-type: application/json' \
   -o 'test.pdf' \
   --data-binary @- << EOF
{
  "data": {
      "firstName": "Joe",
      "lastName": "Smith"
    },
    "options": {
      "cacheReport": false,
      "convertTo": "pdf",
      "overwrite": true,
      "reportName": "{d.firstName}_{d.lastName}.pdf"
    }
}
EOF

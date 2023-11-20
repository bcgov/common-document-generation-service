import fetch from 'node-fetch';
import fs from 'fs';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

function base64_encode(file) {
  const contents = fs.readFileSync(file);
  return contents.toString('base64');
}

// We need the oidc api to generate a token for us
const oidcResponse = await fetch(
  'https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token',
  {
    method: 'POST',
    body: `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }
);

const keycloak = await oidcResponse.json();

console.log(keycloak);

// {
//   access_token: 'secret_token',
//   expires_in: 300,
//   refresh_expires_in: 0,
//   token_type: 'bearer',
//   'not-before-policy': 0,
//   scope: ''
// }

const templateContent = base64_encode('./template.txt');

// #template.txt
// Hello {d.firstName} {d.lastName}!

const cdogsResponse = await fetch(
  'https://cdogs-dev.apps.silver.devops.gov.bc.ca/api/v2/template/render',
  {
    method: 'POST',
    body: JSON.stringify({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      template: {
        encodingType: 'base64',
        fileType: 'txt',
        content: templateContent,
      },
      options: {
        convertTo: 'pdf',
        overwrite: true,
        reportName: '{d.firstName}-{d.lastName}.pdf',
      },
    }),
    headers: {
      Authorization: `Bearer ${keycloak.access_token}`,
      'Content-Type': 'application/json',
    },
  }
);

const pdf = await cdogsResponse.arrayBuffer();

// saves a file test.pdf - the CDOGS output.
fs.writeFileSync('test.pdf', Buffer.from(pdf), 'binary');

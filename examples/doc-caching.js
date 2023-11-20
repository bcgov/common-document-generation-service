import fetch from 'node-fetch';
import fs from 'fs';
import { fileFromSync } from 'fetch-blob/from.js';
import { FormData } from 'formdata-polyfill/esm.min.js';

const template = fileFromSync('./template.txt');
const fd = new FormData();
let templateHash;

fd.append('template', template);

const cdogsTemplateCacheResponse = await fetch(
  'http://localhost:3000/api/v2/template',
  {
    method: 'POST',
    body: fd,
  }
);

if (cdogsTemplateCacheResponse.ok) {
  templateHash = await cdogsTemplateCacheResponse.text();

  /*
   * If this response is successful, it will return the hash that relates to this uploaded template.
   * It must be saved for further api usage.
   */

  console.log(templateHash);
  //   bffe2a344ec1f8fb4fc1a1496df4ca29277da310f64eaa8748a1888b7a2198c5
} else {
  const apiError = await cdogsTemplateCacheResponse.json();

  /*
   * If this response is not successful an (RFC 7807) `api-problem` is returned.
   * https://www.npmjs.com/package/api-problem
   */

  console.log(apiError);
  //   {
  //     type: 'https://httpstatuses.com/405',
  //     title: 'Method Not Allowed',
  //     status: 405,
  //     detail: "File already cached. Hash 'bffe2a344ec1f8fb4fc1a1496df4ca29277da310f64eaa8748a1888b7a2198c5'."
  //   }

  process.exit(1);
}

const cdogsRenderResponse = await fetch(
  `http://localhost:3000/api/v2/template/${templateHash}/render`,
  {
    method: 'POST',
    body: JSON.stringify({
      data: {
        firstName: 'Common',
        lastName: 'Services',
      },
      options: {
        convertTo: 'pdf',
      },
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const pdf = await cdogsRenderResponse.arrayBuffer();

// saves a file test.pdf - the CDOGS output.
fs.writeFileSync('test.pdf', Buffer.from(pdf), 'binary');

// Removing the template from the cache
const cdogsTemplateDeleteResponse = await fetch(
  `http://localhost:3000/api/v2/template/${templateHash}`,
  {
    method: 'DELETE',
  }
);

if (cdogsTemplateDeleteResponse.ok) {
  const OK = await cdogsTemplateDeleteResponse.text();

  // just prints OK.
  console.log(OK);
} else {
  const apiError = await cdogsTemplateDeleteResponse.json();

  /*
   * If this response is not successful an (RFC 7807) `api-problem` is returned.
   * https://www.npmjs.com/package/api-problem
   */

  console.log(apiError);
}

# Application Details

The application is a node server which serves the Common Document Generation Service API. It uses the following dependencies from NPM:

Authentication & Password Management

- [keycloak-connect](https://www.npmjs.com/package/keycloak-connect) - Node adapter for Keycloak OIDC

Networking

- [api-problem](https://www.npmjs.com/package/api-problem) - RFC 7807 problem details
- [express](https://www.npmjs.com/package/express) - Server middleware

Configuration

- [config](https://www.npmjs.com/package/config) - organizes hierarchical configurations for your app deployments; handles environment variables, command line parameters and external sources.

Logging

- [morgan](https://www.npmjs.com/package/morgan) - HTTP request logger
- [npmlog](https://www.npmjs.com/package/npmlog) - General log framework

Docker Image

- [bcgovimages/alpine-node-libreoffice](https://hub.docker.com/r/bcgovimages/alpine-node-libreoffice) - a base image with Node.js LTS and LibreOffice™ installed.  LibreOffice™ is used for the file conversions.

## Design and Usage

The `/template/render` endpoint request body is composed of 3 main parts.

1. The set of **data**, an object containing the set of replacement variables to merge into the template.  This can be an array of objects.
2. **options**, an object to override default behaviours.  Callers should be setting: convertTo = (output file type), reportName = (output file name), and overwrite=true.
3. The document **template**, currently only accepts this as a base64 encoding.

``` json
{
  "data": {
    "firstName": "Jane",
    "lastName": "Smith",
    "title": "CEO"
  },
  "options": {
    "convertTo": "pdf",
    "reportName": "{d.firstName}-{d.lastName}.docx",
    "overwrite": "true"
  },
  "template": {
    "fileType": "docx",
    "encodingType": "base64",
    "content": "base64 encoded content..."
  }
}
```

The functionality of this endpoint is relatively simple, being that it functions mostly as a pass-through to the Carbone library to do the generation logic.  Templates and rendered reports are written to disk and can fetched or deleted through the api.  Refer to the [carbone-copy-api](https://github.com/bcgov/common-services-team-library/tree/master/npm/carbone-copy-api/docs) documentation.

The templating engine is XML-agnostic. It means the template engine works on any valid XML-based documents, not only XML-documents created by Microsoft Office™, LibreOffice™ or OpenOffice™.

### Concepts

In order to provide template substitution of variables into the supplied document, we have to pass in a **data*-  object.  The data object is a free-form JSON object which consists of key-value pairs. The purpose is to provide a key-value mapping between an inline variable in the template document and the intended merged document output after the values are replaced.  **data*- can be an array of JSON objects.

Carbone can behave as a glorified string-replacement engine, or more complex conditional or iterative logic can be built into the template variables. See below sections for documentation.
In the event the Context object has extra variables that are not used in the template document, nothing happens. You can expect to see blanks where no value was substituted.

## Templating

We currently leverage the Carbone JS library for variable replacement into document templates. Carbone finds all markers `{}` in your document (xlsx, odt, docx, ...) and replaces these markers by Context variables representing the data. According to the syntax of your markers, you can make a number of complex operations if desired, further documentation below describes this more.

The convention of having "d." before variable names from the Context (d for "data") is used by the templating engine.

As repetitions (loops of arrays) are a core component of the templating engine, the data object in the request body can be an array, or contain arrays.

### [Variable Substitution](https://carbone.io/documentation.html#substitutions)

The Carbone templating engine allows variables to be in-line displayed through the use of double curly braces. Suppose you wanted a variable `foo` to be displayed. You can do so by adding the following into a document template:

``` sh
{{d.foo}}
```

Nested objects in the Context are supported. You can lookup properties that have dots in them just like you would in Javascript. Suppose for example you have the following context object and template string:

Context

``` json
{
  "something": {
    "greeting": "Hello",
    "target": "World"
  },
  "someone": "user"
}
```

Template document

``` sh
"My template is: {{d.something.greeting}} {{d.someone}} content {{d.something.target }}"
```

You can expect the template engine to yield the following:

``` sh
"My template is: Hello user content World"
```

### [Repetitions](https://carbone.io/documentation.html#repetitions)

Carbone can repeat a section (rows, title, pages...) of the document.

We don't need to describe where the repetition starts and ends, we just need to design a "repetition example" in the template using the reserved key word i and i+1. Carbone will find automatically the pattern to repeat using the first row (i) as an example. The second row (i+1) is removed before rendering the result.

For the simplest example, suppose you have the following context object and template document:

Context

``` json
{
  "cars" : [
    { "brand": "Lumeneo" },
    { "brand": "Tesla" },
    { "brand": "Toyota" },
    { "brand": "Ford" }
  ]
}
```

Template document

| Cars                  |
| --------------------- |
| {d.cars[i].brand}     |
| {d.cars[i+1].brand}   |

You can expect the template engine to yield the following:

| Cars                  |
| --------------------- |
| Lumeneo    |
| Tesla   |
| Toyota   |
| Ford   |

See the Carbone Repetition documentation for the much more complex examples

### File Name

The `options` object in the request body contains an optional `reportName` field. This field will serve as the requested file name for the resultant merged document.
If not supplied, a random UUID (such as 6a2f41a3-c54c-fce8-32d2-0324e1c32e22) will serve as the placeholder.

You can template the output file name in the same manner as the contents.

An example request is shown below:

``` json
{
  "data": [
    {
      "office": {
        "id": "Dx1997",
        "location": "Hello",
        "phone": "World"
      },
      "contact": "Bob"
    }],
  "options" : {
    "convertTo": "pdf",
    "reportName": "office_contact_{d.office.id}.docx",
  },
  "template": {
    "content": "<encoded file here>",
    "encodingType": "base64",
    "fileType": "docx"
  }
}
```

This will yield a resultant file in the response named
`office_contact_Dx1997.pdf`

#### Further templating functionality

The templating engine in Carbone has a lot of power, refer to the Carbone documentation

- <https://carbone.io/documentation.html#substitutions>
- <https://carbone.io/documentation.html#repetitions>
- <https://carbone.io/documentation.html#formatters>
- <https://carbone.io/documentation.html#translations>

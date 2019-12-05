# Common Document Generation Service

CDOGS - A hosted service to merge sets of data into document templates

## Application

The application is a node server which serves the Common Hosted Email Service API. It uses the following dependencies from NPM:

Authentication & Password Management

* `keycloak-connect` - Node adapter for Keycloak OIDC

Networking

* `api-problem` - RFC 7807 problem details
* `express` - Server middleware

Logging

* `morgan` - HTTP request logger
* `npmlog` - General log framework

Templating

* `carbone` - Mustache-based report generator
* `tmp` - To temporarily write document files to memory

### General Code Layout

The codebase is separated into a few discrete layers:

* `components` - Business logic layer - the majority of useful functionality resides here
* `docs` - Contains OpenAPI 3.0 Yaml specification and ReDoc renderer
* `routes` - Express middleware routing

## Quickstart Guide

In order for the application to run correctly, you will need to ensure that the following have been addressed:

1. All node dependencies have been installed and resolved
2. Environment configurations have been set up

### Install

As this is a Node application, please ensure that you have all dependencies installed as needed. This can be done by running `npm install`.

### Configuration

Configuration management is done using the [config](https://www.npmjs.com/package/config) library. There are two ways to configure:

1. Look at [custom-environment-variables.json](/backend/config/custom-environment-variables.json) and ensure you have the environment variables locally set.
2. Create a `local.json` file in the config folder. This file should never be added to source control.
3. Consider creating a `local-test.json` file in the config folder if you want to use different configurations while running unit tests.

For more details, please consult the config library [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files).

#### Environment Variables

| Environment Variable | Description |
| --- | --- |
| `KC_CLIENTID` | Keycloak Client username |
| `KC_CLIENTSECRET` | Keycloak Client password |
| `KC_REALM` | Associated Keycloak realm |
| `KC_SERVERURL` | Base authentication url for Keycloak |
| `SERVER_BODYLIMIT` | Maximum body length the API will accept |
| `SERVER_LOGLEVEL` | Server log verbosity. Options: `silly`, `verbose`, `debug`, `info`, `warn`, `error` |
| `SERVER_MORGANFORMAT` | Morgan format style. Options: `dev`, `combined` |
| `SERVER_PORT` | Port server is listening to |

## Commands

After addressing the prerequisites, the following are common commands that are used for this application.

### Run the server with hot-reloads for development

``` sh
npm run serve
```

### Run the server

``` sh
npm run start
```

### Run your tests

``` sh
npm run test
```

### Lints files

``` sh
npm run lint
```

## API Usage

This API is defined and described in OpenAPI 3.0 specification. When the API is running, you should be able to view the specification through ReDoc at <http://localhost:3000/api/v1/docs> (assuming you are running this microservice locally). Otherwise, the general API can usually be found under the `/api/v1/docs` path.

### General Design

The `/docGen` endpoint request body is composed of 2 main parts.
1. The document **template**, currently only accepts this as a base64 encoding.
2. The set of **Contexts**, an array of Context objects containing the set of replacement variables to merge into the template.

The functionality of this endpoint is relatively simple, being that it functions mostly as a pass-through to the Carbone library to do the generation logic.
The template file is ephemeraly written to a temporary location (using the 'tmp' javascript library) and only persists there to pass the document to Carbone. Once generation occurs or any error occurs the file is gone. It is not written to any persistant storage.

The templating engine is XML-agnostic. It means the template engine works on any valid XML-based documents, not only XML-documents created by Microsoft Office™, LibreOffice™ or OpenOffice™.

#### Concepts

In order to provide template subtitution of variables into the supplied document, we have the concept of a Context. A **Context** is a freeform JSON object which consists of key-value pairs. The purpose is to provide a key-value mapping between an inline variable in the template document and the intended merged document output after the values are replaced.

In order for a document template to be successfully merged with the replacement variables, it requires a Context object (or arrays of Contexts) which *should* contain the variables which will be replaced.
Carbone can behave as a glorified string-replacement engine, or more complex conditional or iterative logic can be built into the template variables. See below sections for documentation.
In the event the Context object has extra variables that are not used in the template document, nothing happens. You can expect to see blank spots where the templated value should be at.

### Templating

We currently leverage the Carbone JS library for templated variable replacement into document templates. Carbone finds all markers `{}` in your document (xlsx, odt, docx, ...) and replaces these markers by Context variables representing the data. According to the syntax of your markers, you can make a number of complex operations if desired, further documentation below describes this more.

The convention of having "d." before variable names from the Context (d for "data") is used by the templating engine.

As repititions (loops of Context arrays) are a core component of the templating enginr, the Contexts object in the request body expects an array, rather than a singular object.
If **not** using repititions, just include your single Context object as the sole item in the array

#### [Variable Substitution](https://carbone.io/documentation.html#substitutions)

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

#### [Repetitions](https://carbone.io/documentation.html#repetitions)

Carbone can repeat a section (rows, title, pages...) of the document.

We don't need to describe where the repetition starts and ends, we just need to design a "repetition example" in the template using the reserved key word i and i+1. Carbone will find automatically the pattern to repeat using the first row (i) as an example. The second row (i+1) is removed before rendering the result.

For the simplest example, suppose you have the following context object and template document:

Context

``` json
{
  "cars" : [
    {"brand" : "Lumeneo"},
    {"brand" : "Tesla"  },
    {"brand" : "Toyota" },
    {"brand" : "Ford" }
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

See the Carbone Repitition documentation for the much more complex examples


#### File Name
The `template` object in the request body requires a `filename` field. This field will serve as the requested file name for the resultant merged document.
This field should include the **extension** that the supplied template file has.

The file name is able to be templated in the same manner as the contents if desired.

An example request is shown below:

``` json
{
  "contexts": [
    {
      "office": {
        "id": "Dx1997",
        "location": "Hello",
        "phone": "World"
      },
      "contact": "Bob"
    }],
  "template": {
    "filename": "office_contact_{d.office.id}.docx",
    "content": "<encoded file here>"
  }
}
```

This will yield a resultant file in the response named
`office_contact_Dx1997.docx`


#### Further templating functionality

The templating engine in Carbone has a lot of power, refer to the Carbone documentation
- https://carbone.io/documentation.html#substitutions
- https://carbone.io/documentation.html#repetitions
- https://carbone.io/documentation.html#formatters

const templateRouter = require('./template');

const createVersionedRouter = require('../shared/router');

const version = 'v2';
const endpoints = [
  { name: '/api-spec.json', operations: ['GET'] },
  { name: '/api-spec.yaml', operations: ['GET'] },
  { name: '/docs', operations: ['GET'] },
  { name: '/fileTypes', operations: ['GET'] },
  { name: '/health', operations: ['GET'] },
  { name: '/render/{id}', operations: ['GET', 'DELETE'] },
  { name: '/template', operations: ['POST'] },
  { name: '/template/render', operations: ['POST'] },
  { name: '/template/{id}', operations: ['GET', 'DELETE'] },
  { name: '/template/{id}/render', operations: ['POST'] },
];

module.exports = createVersionedRouter(version, {
  endpoints,
  templateRouter,
});

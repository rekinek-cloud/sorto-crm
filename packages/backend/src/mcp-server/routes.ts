/**
 * MCP Server Routes
 * Routing dla endpointów MCP
 */

import { Router } from 'express';
import { mcpServerController } from './mcp-server.controller';
import { apiKeyGuard } from './auth/api-key.guard';
import chatgptActionsController from './chatgpt-actions.controller';
import path from 'path';
import fs from 'fs';

const router = Router();

// Publiczny endpoint - info o serwerze
router.get('/', (req, res) => mcpServerController.getInfo(req, res));

// OpenAPI schema dla ChatGPT Actions (YAML)
router.get('/openapi.yaml', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const yamlPath = path.join(__dirname, '../openapi/chatgpt-actions.yaml');
  if (fs.existsSync(yamlPath)) {
    return res.type('text/yaml').sendFile(yamlPath);
  } else {
    return res.status(404).json({ error: 'OpenAPI schema not found' });
  }
});

// OpenAPI schema dla ChatGPT Actions (JSON)
router.get('/openapi.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  const yamlPath = path.join(__dirname, '../openapi/chatgpt-actions.yaml');
  if (fs.existsSync(yamlPath)) {
    try {
      const yaml = require('js-yaml');
      const content = fs.readFileSync(yamlPath, 'utf8');
      const json = yaml.load(content);
      return res.json(json);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse OpenAPI schema' });
    }
  } else {
    return res.status(404).json({ error: 'OpenAPI schema not found' });
  }
});

// Chronione endpointy MCP - wymagają API Key
router.post('/tools/list', apiKeyGuard, (req, res) => mcpServerController.listTools(req, res));
router.post('/tools/call', apiKeyGuard, (req, res) => mcpServerController.callTool(req, res));

// ChatGPT Actions REST API (alternatywa dla MCP)
router.use('/actions', chatgptActionsController);

export default router;

import { assert } from 'chai'
import { readConfig } from '@/reader'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

describe('config validation', () => {
  const testConfigDir = '/tmp/config-tests'

  beforeEach(async () => {
    await fs.mkdir(testConfigDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true })
  })

  it('should reject config with undefined/invalid keys in a rule', async () => {
    const configPath = path.join(testConfigDir, 'invalid-keys.json')
    const config = {
      rules: [
        {
          namespace: 'Microsoft.Web',  // should be "providerNamespace"
          resourcetype: 'sites',       // should be "resourceType"
          path: 'properties.siteConfig.localMySqlEnabled',  // should be "propertyPath"
        },
      ],
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    try {
      await readConfig(configPath)
      assert.fail('Expected readConfig to throw an error')
    }
    catch (error) {
      const message = (error as Error).message
      assert.include(message.toLowerCase(), 'invalid')
    }
  })

  it('should reject config with empty rule (no valid keys)', async () => {
    const configPath = path.join(testConfigDir, 'empty-rule.json')
    const config = {
      rules: [
        {},  // empty rule should be invalid
      ],
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    try {
      await readConfig(configPath)
      assert.fail('Expected readConfig to throw an error')
    }
    catch (error) {
      const message = (error as Error).message
      assert.include(message.toLowerCase(), 'least one')
    }
  })

  it('should reject config with no rules', async () => {
    const configPath = path.join(testConfigDir, 'no-rules.json')
    const config = {
      rules: [],
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    try {
      await readConfig(configPath)
      assert.fail('Expected readConfig to throw an error')
    }
    catch (error) {
      const message = (error as Error).message
      assert.include(message.toLowerCase(), 'least one')
    }
  })

  it('should accept valid config', async () => {
    const configPath = path.join(testConfigDir, 'valid.json')
    const config = {
      rules: [
        {
          providerNamespace: 'Microsoft.Web',
          resourceType: 'sites',
          propertyPath: 'properties.siteConfig.localMySqlEnabled',
        },
      ],
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    const result = await readConfig(configPath)
    assert.deepEqual(result, config)
  })
})
import * as t from 'io-ts'
import { isLeft } from 'fp-ts/Either'
import { PropertyChangeTypeT } from './whatif'

/** Valid rule keys */
const VALID_RULE_KEYS = [
  'resourceGroupName',
  'providerNamespace', 
  'resourceType',
  'resourceName',
  'resourceNameRegex',
  'propertyPath',
  'propertyChangeType',
] as const

/** filtering rule for validation */
const BaseRuleT = t.intersection([
  t.type({
  }),
  t.partial({
    resourceGroupName: t.string,
    providerNamespace: t.string,
    resourceType: t.string,
    resourceName: t.string,
    resourceNameRegex: t.string,
    propertyPath: t.string,
    propertyChangeType: PropertyChangeTypeT,
  }),
])

/** filtering rule */
export type Rule = t.TypeOf<typeof BaseRuleT>

/** application configuration */
export interface Config {
  rules: Rule[]
}

/** Custom validation function for rules */
function validateRule(rule: unknown): rule is Rule {
  // First validate against the io-ts schema
  const decoded = BaseRuleT.decode(rule)
  if (isLeft(decoded)) {
    return false
  }

  // Check if it's an object
  if (typeof rule !== 'object' || rule === null) {
    return false
  }

  const ruleObj = rule as Record<string, unknown>
  
  // Check for invalid keys (typos, etc.)
  const ruleKeys = Object.keys(ruleObj)
  const invalidKeys = ruleKeys.filter(key => !VALID_RULE_KEYS.includes(key as typeof VALID_RULE_KEYS[number]))
  if (invalidKeys.length > 0) {
    throw new Error(`invalid rule keys found: [${invalidKeys.join(', ')}]. Valid keys are: [${VALID_RULE_KEYS.join(', ')}]`)
  }

  // Check if rule has at least one valid key defined
  const validDefinedKeys = ruleKeys.filter(key => VALID_RULE_KEYS.includes(key as typeof VALID_RULE_KEYS[number]))
  if (validDefinedKeys.length === 0) {
    throw new Error('rule must have at least one valid condition key defined')
  }

  return true
}

/** Enhanced rule type with validation */
const ValidatedRuleT = new t.Type<Rule, Rule, unknown>(
  'ValidatedRule',
  (u): u is Rule => validateRule(u),
  (u, c) => {
    try {
      if (validateRule(u)) {
        return t.success(u)
      }
    }
 catch (error) {
      return t.failure(u, c, (error as Error).message)
    }
    return t.failure(u, c, 'Invalid rule')
  },
  t.identity,
)

/** Custom validation for config */
function validateConfig(config: unknown): config is Config {
  if (typeof config !== 'object' || config === null) {
    return false
  }

  const configObj = config as Record<string, unknown>
  
  if (!Array.isArray(configObj.rules)) {
    return false
  }

  if (configObj.rules.length === 0) {
    throw new Error('configuration must contain at least one rule')
  }

  return true
}

/** Enhanced config type with validation */
const ValidatedConfigT = new t.Type<Config, Config, unknown>(
  'ValidatedConfig',
  (u): u is Config => {
    try {
      return validateConfig(u)
    }
 catch {
      return false
    }
  },
  (u, c) => {
    try {
      if (!validateConfig(u)) {
        return t.failure(u, c, 'Invalid config structure')
      }

      // Validate the base structure first
      const baseValidation = t.type({
        rules: t.array(ValidatedRuleT),
      }).decode(u)
      
      return baseValidation
    }
 catch (error) {
      return t.failure(u, c, (error as Error).message)
    }
  },
  t.identity,
)

/** application configuration for validation */
export const ConfigT = ValidatedConfigT

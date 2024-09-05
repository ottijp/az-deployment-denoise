import { assert } from 'chai'
import { denoiseOperationResult} from '@/rule-engine'
import { OperationResult } from '@/types/whatif'

describe('rule-engine', () => {
  it("filter resource group", async () => {
    const input = await import ('./rule-engine-testdata-resourceid.json') as OperationResult

    const actual = denoiseOperationResult(input, [{
      resourceGroupName: 'test-rg1',
    }])
    assert.deepEqual(actual.changes.map(c => c.resourceId), [
      '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg2/providers/Microsoft.Storage/storageAccounts/testmodified',
    ])
  })

  it("filter resource type", async () => {
    const input = await import ('./rule-engine-testdata-resourcetype.json') as OperationResult

    const actual = denoiseOperationResult(input, [{
      resourceType: 'workspaces',
    }])
    assert.deepEqual(actual.changes.map(c => c.resourceId), [
      '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg1/providers/Microsoft.Storage/storageAccounts/testmodify1',
    ])
  })
})
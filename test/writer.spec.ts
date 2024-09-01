import { assert } from 'chai'
import * as sinon from 'sinon'
import { Printer, test } from '@/writer'
import { OperationResult, PropertyChange } from '@/types/whatif'

const testPrinter: Printer = {
  printLine: function() {},
}

describe('writer', () => {
  afterEach(() => {
    sinon.restore()
  })

  it("printObject", async () => {
    const spy = sinon.spy(testPrinter, 'printLine')
    const input = await import ('./writer-testdata-print-object.json')
    test.printObject(testPrinter, 2, input)
    assert.deepEqual(spy.getCalls().map(elm => elm.args),
      [
        ['apiVersion:  "2023-01-01"', 2, ''],
        ['id:          "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testcreated"', 2, ''],
        ['key1:        "value1"', 2, ''],
        ['key2long:    42', 2, ''],
        ['key3:        true', 2, ''],
        ['key4.key4-1: "value4-1"', 2, ''],
        ['key5: [', 2, ''],
        ['0:', 3, ''],
        [],
        ['key5-1: "value5-1"', 4, ''],
        [],
        ['1: "value5-2"', 3, ''],
        [']', 2, ''],
        ['type:        "Microsoft.Storage/storageAccounts"', 2, ''],
      ],
    )
  })

  describe('printPropertyChange', () => {
    it("create", async () => {
      const spy = sinon.spy(testPrinter, 'printLine')
      const input = await import ('./writer-testdata-print-delta-create.json')
      test.printPropertyChange(testPrinter, 2, input as PropertyChange[])
      assert.deepEqual(spy.getCalls().map(elm => elm.args),
        [
          ['key1:     "value1"', 2, 'Create'],
          ['key2long: 42', 2, 'Create'],
          ['key3:     true', 2, 'Create'],

          ['key4:', 2, 'Create'],
          [],
          ['key4-1:          "value4-1"', 3, ''],
          ['key4-2:          43', 3, ''],
          ['key4-3:          false', 3, ''],
          ['key4-4.key4-4-1: "value4-4-1"', 3, ''],
          ['key4-5: [', 3, ''],
          ['0:', 4, ''],
          [],
          ['key4-5-1: "value4-5-1"', 5, ''],
          [],
          ['1: "value4-5-2"', 4, ''],
          [']', 3, ''],
          [],

          ['key5: [', 2, 'Create'],
          ['0:', 3, ''],
          [],
          ['key5-1: "value5-1"', 4, ''],
          [],
          ['1: "value5-2"', 3, ''],
          [']', 2, ''],
        ],
      )
    })

    it("delete", async () => {
      const spy = sinon.spy(testPrinter, 'printLine')
      const input = await import ('./writer-testdata-print-delta-delete.json')
      test.printPropertyChange(testPrinter, 2, input as PropertyChange[])
      assert.deepEqual(spy.getCalls().map(elm => elm.args),
        [
          ['key1:     "value1"', 2, 'Delete'],
          ['key2long: 42', 2, 'Delete'],
          ['key3:     true', 2, 'Delete'],

          ['key4:', 2, 'Delete'],
          [],
          ['key4-1:          "value4-1"', 3, ''],
          ['key4-2:          43', 3, ''],
          ['key4-3:          false', 3, ''],
          ['key4-4.key4-4-1: "value4-4-1"', 3, ''],
          ['key4-5: [', 3, ''],
          ['0:', 4, ''],
          [],
          ['key4-5-1: "value4-5-1"', 5, ''],
          [],
          ['1: "value4-5-2"', 4, ''],
          [']', 3, ''],
          [],

          ['key5: [', 2, 'Delete'],
          ['0:', 3, ''],
          [],
          ['key5-1: "value5-1"', 4, ''],
          [],
          ['1: "value5-2"', 3, ''],
          [']', 2, ''],
        ],
      )
    })

    it("modify", async () => {
      const spy = sinon.spy(testPrinter, 'printLine')
      const input = await import ('./writer-testdata-print-delta-modify.json')
      test.printPropertyChange(testPrinter, 2, input as PropertyChange[])
      assert.deepEqual(spy.getCalls().map(elm => elm.args),
        [
          ['key1:     "value1before" => "value1after"', 2, 'Modify'],
          ['key2long: 42 => 43', 2, 'Modify'],
          ['key3:     true => false', 2, 'Modify'],

          ['key4:', 2, 'Modify'],
          [],
          ['key4-1: "value4-1before" => "value4-1after"', 3, 'Modify'],
          ['key4-2: [', 3, 'Array'],
          ['0:', 4, 'Modify'],
          [],
          ['key4-2-0-1: "value4-2-0-1before" => "value4-2-0-1after"', 5, 'Modify'],
          [],
          [']', 3, ''],

          ['key5: [', 2, 'Array'],
          ['0: "value5-0"', 3, 'Create'],
          ['1: 42', 3, 'Delete'],
          ['2: true => false', 3, 'Modify'],
          ['3:', 3, 'Modify'],
          [],
          ['key5-3-1: "value5-3-1before" => "value5-3-1after"', 4, 'Modify'],
          [],
          [']', 2, ''],
        ],
      )
    })
  })

  it("flattenObject", () => {
    const input = {
      foo1: 'bar',
      foo2: 42,
      foo3: true,
      foo4: {
        foo4foo1: 'bar',
        foo4foo2: [
          {
            foo4foo2foo1: 'bar',
          },
          {
            foo4foo2foo2: 'bar',
          },
        ],
      },
      foo5: [
        {
          foo5foo1: 'bar',
        },
        {
          foo5foo2: 'bar',
        },
        'foo5foo3',
      ],
    }
    const result = test.flattenObject(input)
    assert.deepEqual(result, {
      foo1: 'bar',
      foo2: 42,
      foo3: true,
      'foo4.foo4foo1': 'bar',
      'foo4.foo4foo2': [
        {
          foo4foo2foo1: 'bar',
        },
        {
          foo4foo2foo2: 'bar',
        },
      ],
      foo5: [
        {
          foo5foo1: 'bar',
        },
        {
          foo5foo2: 'bar',
        },
        'foo5foo3',
      ],
    })
  })

  it("organizeResult", async () => {
    const input = await import ('./writer-testdata-organize-result.json') as OperationResult
    const result = test.organizeResult(input)
    assert.deepEqual(result.scopes.map(elm => ({
      id: elm.id,
      resourceIds: elm.changes.map(r => r.resourceId),
    })), [
      {
        id: '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg',
        resourceIds: [
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testdelete1',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testdelete2',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testcreate1',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testcreate2',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.OperationalInsights/workspaces/testmodify1',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.OperationalInsights/workspaces/testmodify2',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testnochange1',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testnochange2',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testignore1',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testignore2',
        ],
      },
      {
        id: '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg2',
        resourceIds: [
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg2/providers/Microsoft.Storage/storageAccounts/testdelete3',
          '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg2/providers/Microsoft.Storage/storageAccounts/testcreate3',
        ],
      },
    ])
  })
})

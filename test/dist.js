const ConsulService = require('../dist')

describe('dist', () => {
  it('properly exposes its inners', () => {
    expect(ConsulService).not.toBeUndefined()
  })
})

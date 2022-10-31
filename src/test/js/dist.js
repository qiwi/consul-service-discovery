// eslint-disable-next-line @typescript-eslint/no-var-requires
const ConsulService = require('../../../target/es5')

describe('dist', () => {
  it('properly exposes its inners', () => {
    expect(ConsulService).not.toBeUndefined()
  })
})
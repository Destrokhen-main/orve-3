import { createInstance, OrveInstance } from '../';
import { OrvePlugin } from '../plugins/plugins';

describe('plugin', () => {
  let instance: OrveInstance
  let error = jest.fn();

  beforeAll(() => {
    console.error = error; 
  })

  beforeEach(() => {
    instance = createInstance();
    jest.clearAllMocks();
  })

  it('should correct add plugins', () => {
    instance.use({
      setup(context) {
        context.$a = 1;
      }
    })

    expect(instance._getPlugins()).toStrictEqual({
      $a: 1
    })
  })

  it('should correct add 2 plugins', () => {
    instance.use({
      setup(cx) {
        cx.$a = 1;
      }
    })

    instance.use({
      setup(cx) {
        cx.$b = (cx.$a as number) + 1;
      }
    })

    expect(instance._getPlugins()).toStrictEqual({
      $a: 1,
      $b: 2,
    })
  })

  it('should draw error', () => {
    instance.use({
      setup(cx) {
        cx.$a = 2;
        throw new Error('asd');
      }
    })

    expect(instance._getPlugins()).toStrictEqual({});
    expect(error).toHaveBeenCalled();
  })
})
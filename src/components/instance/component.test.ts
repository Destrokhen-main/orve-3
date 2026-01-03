import type { Component } from './type';
import { ComponentClass } from './component';
import { state } from '../../core/reactive/state';
import { nextTick, setEffectOnces } from '../../core/reactive/core';

describe('Component', () => {
  it('create component with isRecalabelComponent = false', () => {
    const TestComponent: Component<any> = () => {
      return "1";
    }
    
    const component = new ComponentClass(TestComponent);

    component.setup({});

    expect(component.isRecalabelComponent).toBe(false);
  });

  it('create component with isRecalabelComponent = true', () => {
    const TestComponent: Component<any> = () => {
      return () => "1";
    }
    const component = new ComponentClass(TestComponent);

    component.setup({});

    expect(component.isRecalabelComponent).toBe(true);
  });

  it('create reactive component isRecalabelComponent = true', async () => {
    let a: any;
    const Component: Component = () => {
      a = state("1");

      return () => {
        return a.get();
      }
    }

    const component = new ComponentClass(Component);
    component.setup(undefined);
    
    const effect = jest.fn(() => {
      return component.render();
    });

    setEffectOnces(effect);

    expect(effect).toHaveReturnedWith("1");
    a.set('2');
    await nextTick();
    expect(effect).toHaveReturnedWith("2");
  })
})
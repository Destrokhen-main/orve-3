import { insert } from "./helperNode/insert";
import type { Component, RenderComponent, Props, ComponentInstanceOptions } from "./type";

export class NodeClass {
  /* 
    Надо подумать, над тем, чтоб обычные ноды, обрабатывались через этот класс
    Это нужно для того, чтобы, правильно работать с реактивными пропсами, тут это будет происходить
    Это если компонент не возвращает функцию, а возвращает сразу JSX которые не будет перерендериваться 
  
  */
}

export class ComponentClass<T extends Props> {
  /* 
    Что тут должно происходить

    Надо попробовать сделать, чтобы компонент, сам проводил валидацию компонента.
    Отдаю сюда функцию компонента.

    Внутри компонента может быть ещё компоненты, они должны храниться в нём, чтобы иметь возможность,
    вызвав destroy и разрушить сразу все компоненты + node.

    нужно хранить все Children

    компоненты могут быть, реактивными единицами

    o-for, o-if

    могут возвращаться как JSX.Element так и функцию которая возвращает JSX.Element или null;

    плюс правильное надо определять когда компонент однорендовый, а когда это функция render.


    компонент должен сам уметь обновлять node и хранить её в себе, чтоб он мог сам работать с ней
  */
}

export function ComponentInstance<T extends Props>(fnComponent: Component<T>, options: {
  levelRender: number
}) {
  // return new ComponentClass(fnComponent, options)
}
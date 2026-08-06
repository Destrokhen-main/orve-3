import { Computed, computed, inject, provide, state } from "orve";
import { Message, User } from "../types/types";

const STORE_KEY = Symbol('orve-message');

export type Store = {
  users: Computed<User[]>;
  message: Computed<Message[]>;
  messageWithUser: Computed<Message[]>;
  addMessage: (userId: string, body: string) => void,
  myId: string;
}

export function setupStore() {
  const users = state<User[]>([{
    id: '1',
    name: 'YOU',
  },{
    id: '2',
    name: 'Jamme'
  }]);
  const message = state<Message[]>([
    {
      id: '1',
      message: 'HELLO',
      userId: '1',
      data: '123',
    },
    {
      id: '2',
      message: 'WORLD',
      userId: '2',
      data: '124',
    }
  ]);

  const addMessage = (userId: string, body: string) => {
    message.set((v) => [...v, {
      id: String(Math.random()),
      userId,
      message: body,
      data: '123',
    }])
  }

  const messageWithUser = computed(() => {
    return message.value.map((mess) => {
      const user = users.value.find((user) => user.id === mess.userId);
      return {
        ...mess,
        user: user,
      }
    })
  }, {
    deps: [message]
  })

  provide(STORE_KEY, {
    users: computed(() => users.value),
    messages: computed(() => message.value),
    messageWithUser,
    addMessage,
    myId: '1',
  });
}

export function useStore() {
  return inject<Store>(STORE_KEY);
}
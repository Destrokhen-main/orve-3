import { Computed, computed, inject, provide, reactive, state } from "orve";
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
  const users = reactive<User[]>([{
    id: '1',
    name: 'YOU',
  },{
    id: '2',
    name: 'Jamme'
  }]);
  const message = reactive<Message[]>([
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
    message.push({
      id: String(Math.random()),
      userId,
      message: body,
      data: '123',
    })
  }

  const messageWithUser = computed(() => {
    return message.map((mess) => {
      const user = users.find((user) => user.id === mess.userId);
      return {
        ...mess,
        user: user,
      }
    })
  }, {
    deps: [message]
  })

  provide(STORE_KEY, {
    users: computed(() => users),
    messages: computed(() => message),
    messageWithUser,
    addMessage,
    myId: '1',
  });
}

export function useStore() {
  return inject<Store>(STORE_KEY);
}
import { defineOptions, For } from "orve"
import { useStore } from "../store/main"

export const MessageBox = () => {
  defineOptions({
    single: true
  })

  const context = useStore();

  return () => (
    <div class="message-box">
      <For each={() => context!.messageWithUser.value} by={(message) => message.id}>
        {(message) => {
          return (
            <div class={() => ({"message-box__item": true, my: message.value.userId === context!.myId})}>
              <div class="message-box__item__user">{() => message.value.user!.name}</div>
              <div class="message-box__item__message">{() => message.value.message}</div>
            </div>
          )
        }}
      </For>
    </div>
  )
}
import { state } from "orve"
import { useStore } from "../store/main";

export const InputBox = () => {
  const context = useStore();
  const input = state<string>('');

  const send = (isYou: boolean = true) => {
    const message = input.value;
    context?.addMessage(isYou ? context.myId : '2', message);
    input.set('');
  }

  return () => (
    <div class="input-wrapper" style={{ marginTop: '10px' }}>
      <textarea class="input" rows={5} value={input.value} onInput={(e: any) => input.set(e.target.value)}></textarea>
      <button disabled={input.value.length === 0} onClick={() => send()}>Send</button>
      <button disabled={input.value.length === 0} onClick={() => send(false)}>Send Another</button>
    </div>
  )
}
// @ts-ignore
import './style.css';

import { InputBox } from './components/Input';
import { MessageBox } from './components/MessageBox';
import { setupStore } from './store/main';

export const Main = () => {
  setupStore();

  return () => (
    <div>
      <MessageBox />
      <InputBox />
    </div>
  )
}
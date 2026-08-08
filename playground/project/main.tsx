// @ts-ignore
import './style.css';

import { InputBox } from './components/Input';
import { MessageBox } from './components/MessageBox';
import { LayoutStore } from './store/main';

export const Main = () => {
  return () => (
    <LayoutStore>
      <MessageBox />
      <InputBox />
    </LayoutStore>
  )
}
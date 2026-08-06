export type Message = {
  id: string;
  userId: string;
  user?: User;
  message: string;
  data: string;
}

export type User = {
  id: string;
  name: string;
}
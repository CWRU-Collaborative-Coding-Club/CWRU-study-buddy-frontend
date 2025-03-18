export const SIGNIN_PATH: string = "/auth/signin";
export const SIGNUP_PATH: string = "/auth/signup";

export interface Provider {
  id: "credentials";
  name: string;
}

export const providerMap: Provider[] = [
  { id: "credentials", name: "Credentials" },
];

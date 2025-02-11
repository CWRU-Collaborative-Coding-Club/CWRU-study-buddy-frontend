export const SIGNIN_PATH: string = "/auth/signin";
export const SIGNUP_PATH: string = "/auth/signup";

export interface Provider {
  id: "github" | "google" | "credentials";
  name: string;
}

export const providerMap: Provider[] = [
  { id: "google", name: "Google" },
  { id: "credentials", name: "Credentials" },
];

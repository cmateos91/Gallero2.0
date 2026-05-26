import { z } from "zod";

export const RegisterSchema = z.object({
  email:    z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y _"),
  password: z.string().min(6).max(100),
});

export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password:        z.string().min(1),
});

export const GoogleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type RegisterDto   = z.infer<typeof RegisterSchema>;
export type LoginDto      = z.infer<typeof LoginSchema>;
export type GoogleLoginDto = z.infer<typeof GoogleLoginSchema>;

export type AuthUserDto = {
  id:           string;
  email:        string;
  username:     string;
  mmr:          number;
  coins:        number;
  streakDays:   number;
  towerHighFloor: number;
  createdAt:    Date;
};

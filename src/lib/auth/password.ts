import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  return hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(
  plainText: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(plainText, hashedPassword);
}
